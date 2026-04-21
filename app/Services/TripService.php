<?php

namespace App\Services;

use App\Models\Trip;
use App\Models\TripAttendance;
use App\Models\Bus;
use App\Models\Student;
use App\Models\TripStudent;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TripService
{
    public function __construct(protected NotificationService $notificationService) {}

    /**
     * Automatically create daily trips (forth and back) for buses with assigned routes.
     */
    public function autoCreateDailyTrips(?Carbon $date = null): array
    {
        $targetDate = $date ?: Carbon::today();
        $buses = Bus::whereNotNull('route_id')->get();

        Log::info('[DailyTrips] Auto-create started', ['date' => $targetDate->toDateString(), 'buses' => $buses->count()]);

        $created = 0;
        $skipped = 0;

        foreach ($buses as $bus) {
            DB::transaction(function () use ($bus, $targetDate, &$created, &$skipped) {
                [$forthResult, $forthReason] = $this->createDailyTrip($bus, 'forth', $targetDate, (int)$bus->route_id);
                [$backResult, $backReason]   = $this->createDailyTrip($bus, 'back', $targetDate, (int)$bus->route_id);

                $forthNew = $forthResult !== null && $forthResult->wasRecentlyCreated;
                $backNew  = $backResult !== null && $backResult->wasRecentlyCreated;

                if ($forthNew) { $created++; } else { $skipped++; }
                if ($backNew)  { $created++; } else { $skipped++; }

                Log::info("[DailyTrips] Bus {$bus->id} ({$bus->bus_number})", [
                    'forth' => $forthNew ? 'created' : "skipped ($forthReason)",
                    'back'  => $backNew  ? 'created' : "skipped ($backReason)",
                ]);
            });
        }

        Log::info('[DailyTrips] Auto-create finished', [
            'date'    => $targetDate->toDateString(),
            'created' => $created,
            'skipped' => $skipped,
        ]);

        return [
            'created' => $created,
            'skipped' => $skipped,
        ];
    }

    /**
     * Create a specific daily trip and its attendance records.
     * Returns [Trip|null, string reason]
     */
    public function createDailyTrip(Bus $bus, string $type, Carbon $date, int $routeId): array
    {
        Log::info('[TripService] createDailyTrip called', ['bus_id' => $bus->id, 'type' => $type, 'date' => $date->toDateString()]);
        
        // Check if trip already exists for today
        $existingTrip = Trip::where('bus_id', $bus->id)
            ->where('type', $type)
            ->whereDate('trip_date', $date)
            ->first();

        if ($existingTrip) {
            Log::info('[TripService] Trip already exists', ['bus_id' => $bus->id, 'type' => $type]);
            return [$existingTrip, 'already_exists'];
        }

        // Driver and Assistant (المشرفة) are informed from the bus
        if (!$bus->driver || !$bus->assistant_id) {
            Log::warning('[TripService] Missing staff assignment', ['bus_id' => $bus->id]);
            return [null, 'missing_staff_assignment'];
        }

        $trip = Trip::create([
            'bus_id' => $bus->id,
            'trip_date' => $date,
            'type' => $type,
            'status' => 'pending',
        ]);

        // Get students assigned to this bus for this direction
        $busField = $type === 'forth' ? 'forth_bus_id' : 'back_bus_id';
        $students = Student::where($busField, $bus->id)->get();

        foreach ($students as $student) {
            TripAttendance::create([
                'trip_id' => $trip->id,
                'student_id' => $student->id,
                'status' => 'absent',
            ]);
        }

        return [$trip, 'created'];
    }

    /**
     * Initialize a field trip after admin approval.
     * Note: FieldTrip is a separate model/table, but we might want to create a 'Trip' 
     * record for the execution phase if we want to unify mobile tracking.
     * For now, following user guidance that they are separate.
     */
    public function initializeFieldTrip(\App\Models\FieldTrip $fieldTrip): void
    {
        DB::transaction(function () use ($fieldTrip) {
            foreach ($fieldTrip->students as $student) {
                // We logic for field trip attendance might need a separate table or 
                // a way to link to the general TripAttendance if we unify.
                // Since they are separate, we stick to FieldTrip logic.
            }
            
            $fieldTrip->update(['status' => 'approved']);
        });
    }

    /**
     * Mark student attendance status.
     */
    public function markAttendance(int $tripId, int $studentId, string $status): void
    {
        $attendance = TripAttendance::where('trip_id', $tripId)
            ->where('student_id', $studentId)
            ->firstOrFail();

        $trip = $attendance->trip;
        $updateData = ['status' => $status];

        if ($status === 'boarded') {
            $updateData['check_in_time'] = now();
            $this->notificationService->notifyStudentGuardian(
                $studentId,
                'bus_boarding',
                '🚌 ركب الحافلة',
                'تم تسجيل ركوب الطالب في رحلة ' . ($trip->type === 'forth' ? 'الذهاب' : 'العودة')
            );
        } elseif ($status === 'dropped') {
            $updateData['check_out_time'] = now();
            $this->notificationService->notifyStudentGuardian(
                $studentId,
                'bus_alighting',
                '✅ نزل من الحافلة',
                'تم تسجيل نزول الطالب من الرحلة بأمان'
            );
        }

        $attendance->update($updateData);
    }
}


