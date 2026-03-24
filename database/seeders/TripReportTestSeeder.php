<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\School;
use App\Models\User;
use App\Models\Bus;
use App\Models\BusGroup;
use App\Models\Student;
use App\Models\BusBoardingLog;
use Carbon\Carbon;

class TripReportTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // 1. Get the first active school or create one
        $school = School::first();
        if (!$school) {
            $school = School::create([
                'name' => 'Test School',
                'status' => 'active',
                'contact_number' => '1234567890',
            ]);
        }

        // 2. Create a supervisor
        $supervisor = User::firstOrCreate(
            ['email' => 'supervisor_test@example.com'],
            [
                'name' => 'مختار المشرف',
                'password' => Hash::make('password'),
                'role' => 'supervisor',
                'school_id' => $school->id,
                'phone' => '0501234567'
            ]
        );

        // 3. Create a Bus
        $bus = Bus::firstOrCreate(
            ['bus_number' => 'B-999'],
            [
                'school_id' => $school->id,
                'supervisor_id' => $supervisor->id,
                'plate_number' => 'XYZ-1234',
                'bus_code' => 'BC-999',
                'model' => 'Toyota Coaster',
                'year' => 2024,
                'capacity' => 30,
                'status' => 'active'
            ]
        );

        // 4. Create a Bus Group
        $group = BusGroup::firstOrCreate(
            ['name' => 'مجموعة الاختبار (Test Group)'],
            [
                'school_id' => $school->id,
                'bus_id' => $bus->id,
            ]
        );

        // 4.5 Create a Guardian
        $guardian = User::firstOrCreate(
            ['email' => 'guardian_test@example.com'],
            [
                'name' => 'ولي الأمر (Test Guardian)',
                'password' => Hash::make('password'),
                'role' => 'parent',
                'school_id' => $school->id,
                'phone' => '0509999999'
            ]
        );

        // 5. Create some students for this group
        $studentNames = [
            ['ar' => 'أحمد عبدالله', 'en' => 'Ahmed Abdullah'],
            ['ar' => 'سالم محمد', 'en' => 'Salem Mohammed'],
            ['ar' => 'فاطمة علي', 'en' => 'Fatima Ali'],
            ['ar' => 'مريم سعيد', 'en' => 'Maryam Saeed']
        ];

        $students = [];
        foreach ($studentNames as $idx => $names) {
            $students[] = Student::firstOrCreate(
                ['full_name' => $names['ar']],
                [
                    'full_name_en' => $names['en'],
                    'student_code' => 'STU-TEST-' . $idx,
                    'national_id' => '10000000' . $idx,
                    'school_id' => $school->id,
                    'is_active' => true,
                    'guardian_id' => $guardian->id,
                    'morning_group_id' => $group->id,
                    'afternoon_group_id' => $group->id
                ]
            );
        }

        // 6. Generate Boarding Logs for TODAY
        $today = Carbon::today();
        
        // Generate a "to_school" trip
        $tripStartAt = $today->copy()->setHour(6)->setMinute(30);
        
        // Delete old logs for today for this group to avoid duplicates on multiple runs
        BusBoardingLog::where('bus_id', $bus->id)
            ->whereDate('recorded_at', $today)
            ->delete();

        foreach ($students as $idx => $student) {
            // Give each student a slightly staggered time
            $actionTime = $tripStartAt->copy()->addMinutes($idx * 5);
            
            // 7. Boarding 
            BusBoardingLog::create([
                'student_id' => $student->id,
                'bus_id' => $bus->id,
                'direction' => 'to_school',
                'type' => 'boarding',
                'recorded_at' => $actionTime,
                'latitude' => 24.7136,
                'longitude' => 46.6753,
            ]);

            // 8. Alighting (Dropping off at school)
            BusBoardingLog::create([
                'student_id' => $student->id,
                'bus_id' => $bus->id,
                'direction' => 'to_school',
                'type' => 'alighting',
                'recorded_at' => $actionTime->copy()->addMinutes(20),
                'latitude' => 24.7136,
                'longitude' => 46.6753,
            ]);
        }

        $this->command->info('Trip Report dummy data generated successfully for today: ' . $today->toDateString());
    }
}
