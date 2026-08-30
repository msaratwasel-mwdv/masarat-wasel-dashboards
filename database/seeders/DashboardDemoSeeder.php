<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Bus;
use App\Models\Delay;
use App\Models\FieldTrip;
use App\Models\School;
use App\Models\Student;
use App\Models\Trip;
use App\Models\TripAttendance;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DashboardDemoSeeder extends Seeder
{
    public function run()
    {
        $school = School::first();
        if (! $school) {
            $this->command->info('No school found to seed demo data.');

            return;
        }

        $schoolId = $school->id;
        $today = Carbon::today();

        // 1. Ensure some active buses exist
        $buses = Bus::where('school_id', $schoolId)->where('status', 'active')->get();
        if ($buses->isEmpty()) {
            $buses = Bus::factory()->count(5)->create([
                'school_id' => $schoolId,
                'status' => 'active',
            ]);
        }
        $busId = $buses->first()->id;

        // 2. Ensure some students exist
        $students = Student::inSchool($schoolId)->get();
        if ($students->isEmpty()) {
            $this->command->error('No students found in the school! Please seed students first.');

            return;
        }

        // 3. Create Trips for Today (Finished)
        $selectedBuses = $buses->take(3);
        foreach ($selectedBuses as $bus) {
            $trip = Trip::updateOrCreate(
                [
                    'bus_id' => $bus->id,
                    'trip_date' => $today,
                    'type' => 'morning',
                ],
                [
                    'school_id' => $schoolId,
                    'status' => 'finished',
                    'departure_time' => $today->copy()->setHour(6)->setMinute(30),
                    'arrival_time' => $today->copy()->setHour(7)->setMinute(15),
                ]
            );

            // Add Trip Attendances for Today
            foreach ($students->random(10) as $student) {
                TripAttendance::firstOrCreate([
                    'trip_id' => $trip->id,
                    'student_id' => $student->id,
                ], [
                    'status' => 'boarded',
                    'check_in_time' => $today->copy()->setHour(6)->setMinute(rand(30, 45)),
                    'check_out_time' => $today->copy()->setHour(7)->setMinute(15),
                ]);
            }
        }

        // 4. Create Trips for the past 7 days (Success Rate)
        for ($daysAgo = 1; $daysAgo <= 7; $daysAgo++) {
            $date = $today->copy()->subDays($daysAgo);

            // Finished trips
            $dailyBuses = $buses->shuffle()->take(rand(2, 4));
            foreach ($dailyBuses as $bus) {
                Trip::updateOrCreate(
                    [
                        'bus_id' => $bus->id,
                        'trip_date' => $date,
                        'type' => 'morning',
                    ],
                    [
                        'school_id' => $schoolId,
                        'status' => 'finished',
                    ]
                );
            }

            // Cancelled trip (to make success rate < 100%)
            if (rand(1, 10) > 7) {
                Trip::updateOrCreate(
                    [
                        'bus_id' => $buses->random()->id,
                        'trip_date' => $date,
                        'type' => 'back',
                    ],
                    [
                        'school_id' => $schoolId,
                        'status' => 'cancelled',
                    ]
                );
            }

            // School Attendances for trend chart
            $presentCount = rand(85, 95); // High attendance percentage
            $totalStudents = $students->count();

            foreach ($students as $index => $student) {
                $classroomId = $student->currentEnrollment?->classroom_id;
                if (! $classroomId) {
                    continue;
                }

                Attendance::updateOrCreate(
                    [
                        'student_id' => $student->id,
                        'date' => $date,
                    ],
                    [
                        'classroom_id' => $classroomId,
                        'status' => ($index < ($totalStudents * $presentCount / 100)) ? 'present' : 'absent',
                    ]
                );
            }
        }

        // 5. Create Today's School Attendance
        foreach ($students as $index => $student) {
            $classroomId = $student->currentEnrollment?->classroom_id;
            if (! $classroomId) {
                continue;
            }

            Attendance::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'date' => $today,
                ],
                [
                    'classroom_id' => $classroomId,
                    'status' => ($index < ($students->count() * 0.9)) ? 'present' : 'absent',
                ]
            );
        }

        // 6. Create Delays this month
        for ($i = 0; $i < 2; $i++) {
            Delay::create([
                'bus_id' => $busId,
                'student_id' => $students->random()->id,
                'type' => 'bus',
                'duration_minutes' => rand(10, 20),
                'reason' => 'Heavy Traffic',
                'created_at' => $today->copy()->subDays(rand(1, 10)),
            ]);
        }

        // 7. Create Completed Field Trips
        FieldTrip::create([
            'school_id' => $schoolId,
            'name' => 'Museum Visit',
            'description' => 'A visit to the National Museum',
            'destination_address' => 'National Museum',
            'date' => $today->copy()->subDays(5),
            'departure_time' => '08:00',
            'arrival_time' => '13:00',
            'status' => 'completed',
        ]);

        $this->command->info("Demo data seeded successfully for School ID: {$schoolId}");
    }
}
