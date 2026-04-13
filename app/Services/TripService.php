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
            ->whereDate('departure_time', $date)
            ->first();

        if ($existingTrip) {
            Log::info('[TripService] Trip already exists', ['bus_id' => $bus->id, 'type' => $type]);
            return [$existingTrip, 'already_exists'];
        }

        $driverUserId = $bus->driver_id;
        $assistantUserId = $bus->assistant_id;

        // Driver and Assistant (المشرفة) must be assigned to the bus for daily routines
        if (!$driverUserId || !$assistantUserId) {
            Log::warning('[TripService] Missing staff assignment', ['bus_id' => $bus->id, 'driver' => $driverUserId, 'assistant' => $assistantUserId]);
            return [null, 'missing_staff_assignment'];
        }

        $trip = Trip::create([
            'bus_id' => $bus->id,
            'route_id' => $routeId,
            'driver_id' => $driverUserId,
            'assistant_id' => $assistantUserId,
            'trip_date' => $date,
            'type' => $type,
            'status' => 'pending',
            'departure_time' => $date->copy()->setTime(0, 0, 0),
        ]);

        // Get students assigned to this route for this direction
        $routeField = $type === 'forth' ? 'forth_route_id' : 'back_route_id';
        $students = Student::where($routeField, $routeId)->get();

        foreach ($students as $student) {
            TripAttendance::create([
                'trip_id' => $trip->id,
                'student_id' => $student->id,
                'status' => 'absent',
                'date' => $date,
            ]);
        }

        return [$trip, 'created'];
    }

    /**
     * Initialize a field trip after admin approval.
     */
    public function initializeFieldTrip(Trip $trip, array $studentIds): void
    {
        if ($trip->type !== 'field_trip') {
            return;
        }

        DB::transaction(function () use ($trip, $studentIds) {
            foreach ($studentIds as $studentId) {
                // Add to participants table
                TripStudent::create([
                    'trip_id' => $trip->id,
                    'student_id' => $studentId,
                ]);

                // Create initial attendance record
                TripAttendance::create([
                    'trip_id' => $trip->id,
                    'student_id' => $studentId,
                    'status' => 'absent',
                    'date' => $trip->departure_time->toDateString(),
                ]);
            }
            
            $trip->update(['status' => 'pending']);
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


