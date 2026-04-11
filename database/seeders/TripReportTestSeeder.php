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
use App\Models\Role;
use App\Models\FieldSupervisor;
use App\Models\Guardian as GuardianProfile;
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
                'first_name_ar' => 'مختار',
                'second_name_ar' => 'المشرف',
                'third_name_ar' => 'الاختباري',
                'last_name_ar' => 'النظام',
                'first_name_en' => 'Mukhtar',
                'second_name_en' => 'Supervisor',
                'third_name_en' => 'Test',
                'last_name_en' => 'System',
                'password' => Hash::make('password'),
                'phone' => '0501234567',
                'national_id' => '1000000088',
            ]
        );

        if (!$supervisor->roles()->where('name', 'field_supervisor')->exists()) {
            $role = Role::firstOrCreate(['name' => 'field_supervisor']);
            $supervisor->roles()->attach($role->id);
            
            FieldSupervisor::firstOrCreate([
                'user_id' => $supervisor->id,
            ]);
        }

        // 3. Create a Bus
        $bus = Bus::firstOrCreate(
            ['bus_number' => 'B-999'],
            [
                'school_id' => $school->id,
                'field_supervisor_id' => $supervisor->id,
                'plate_number' => 'XYZ-1234',
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
                'first_name_ar' => 'ولي',
                'second_name_ar' => 'الأمر',
                'third_name_ar' => 'الاختباري',
                'last_name_ar' => 'النظام',
                'first_name_en' => 'Guardian',
                'second_name_en' => 'Test',
                'third_name_en' => 'Parent',
                'last_name_en' => 'System',
                'password' => Hash::make('password'),
                'phone' => '0509999999',
                'national_id' => '1000000099',
            ]
        );

        if (!$guardian->roles()->where('name', 'parent')->exists()) {
            $role = Role::firstOrCreate(['name' => 'parent']);
            $guardian->roles()->attach($role->id);
            
            GuardianProfile::firstOrCreate([
                'user_id' => $guardian->id,
            ]);
        }

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
                ['national_id' => '10000000' . $idx],
                [
                    'first_name_ar' => $names['ar'],
                    'second_name_ar' => 'اسم',
                    'third_name_ar' => 'ثاني',
                    'last_name_ar' => 'أخير',
                    'first_name_en' => $names['en'],
                    'second_name_en' => 'Second',
                    'third_name_en' => 'Third',
                    'last_name_en' => 'Last',
                    'student_code' => 'STU-TEST-' . $idx,
                    'is_active' => true,
                    'forth_bus_id' => $bus->id,
                    'back_bus_id' => $bus->id,
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
                                'recorded_at' => $actionTime,
                'latitude' => 24.7136,
                'longitude' => 46.6753,
            ]);

            // 8. Alighting (Dropping off at school)
            BusBoardingLog::create([
                'student_id' => $student->id,
                'bus_id' => $bus->id,
                'direction' => 'to_school',
                                'recorded_at' => $actionTime->copy()->addMinutes(20),
                'latitude' => 24.7136,
                'longitude' => 46.6753,
            ]);
        }

        $this->command->info('Trip Report dummy data generated successfully for today: ' . $today->toDateString());
    }
}


