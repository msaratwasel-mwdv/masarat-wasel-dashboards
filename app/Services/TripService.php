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

class TripService
{
    public function __construct(protected NotificationService $notificationService) {}

    /**
     * Automatically create daily trips (forth and back) for buses with assigned routes.
     */
    public function autoCreateDailyTrips(): void
    {
        $today = Carbon::today();
        
        // Get all buses assigned to a route
        $buses = Bus::whereNotNull('route_id')->get();

        foreach ($buses as $bus) {
            DB::transaction(function () use ($bus, $today) {
                // 1. Create Forth Trip (Morning)
                $this->createDailyTrip($bus, 'forth', $today);
                
                // 2. Create Back Trip (Afternoon)
                $this->createDailyTrip($bus, 'back', $today);
            });
        }
    }

    /**
     * Create a specific daily trip and its attendance records.
     */
    private function createDailyTrip(Bus $bus, string $type, Carbon $date): ?Trip
    {
        // Check if trip already exists for today
        $existingTrip = Trip::where('bus_id', $bus->id)
            ->where('type', $type)
            ->whereDate('departure_time', $date)
            ->first();

        if ($existingTrip) {
            return $existingTrip;
        }

        // Driver and Assistant must be assigned to the bus
        // Assuming Bus model has driver_id and supervisor_id (assistant)
        if (!$bus->driver_id || !$bus->supervisor_id) {
            return null;
        }

        $trip = Trip::create([
            'bus_id' => $bus->id,
            'driver_id' => $bus->driver_id,
            'assistant_id' => $bus->supervisor_id,
            'type' => $type,
            'status' => 'pending',
            'departure_time' => $date->copy()->setTime(0, 0, 0), // Placeholder, actual time will be updated when started
        ]);

        // Get students assigned to this route for this direction
        $routeField = $type === 'forth' ? 'forth_route_id' : 'back_route_id';
        $students = Student::where($routeField, $bus->route_id)->get();

        foreach ($students as $student) {
            TripAttendance::create([
                'trip_id' => $trip->id,
                'student_id' => $student->id,
                'status' => 'absent', // Default status
                'date' => $date,
            ]);
        }

        return $trip;
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
