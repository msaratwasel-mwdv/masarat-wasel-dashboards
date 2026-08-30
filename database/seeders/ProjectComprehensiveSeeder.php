<?php

namespace Database\Seeders;

use App\Models\Assistant;
use App\Models\Bus;
use App\Models\Classroom;
use App\Models\Driver;
use App\Models\FieldSupervisor;
use App\Models\Grade;
use App\Models\Guardian;
use App\Models\Role;
use App\Models\Route;
use App\Models\School;
use App\Models\SchoolAdmin;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ProjectComprehensiveSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $fakerAr = \Faker\Factory::create('ar_SA');
        $fakerEn = \Faker\Factory::create('en_US');

        // 1. Roles
        $roleNames = ['admin', 'school_admin', 'field_supervisor', 'driver', 'teacher', 'assistant', 'parent'];
        $roles = [];
        foreach ($roleNames as $name) {
            $roles[$name] = Role::firstOrCreate(['name' => $name]);
        }

        // 2. Schools
        $schoolNames = [
            'مدرسة مسارات الأهلية',
            'مدرسة القمة العالمية',
            'مدارس الرواد المتميزة',
        ];

        $schools = [];
        foreach ($schoolNames as $name) {
            $schools[] = School::updateOrCreate(
                ['name' => $name],
                [
                    'address' => 'الرياض، المملكة العربية السعودية',
                    'status' => 'Active',
                ]
            );
        }
        $school = $schools[0]; // Primary school for the rest of seeding logic

        // 3. Grades (المراحل الدراسية)
        $gradeNames = ['المرحلة الابتدائية', 'المرحلة المتوسطة', 'المرحلة الثانوية'];
        $grades = [];
        foreach ($gradeNames as $name) {
            $grades[] = Grade::firstOrCreate([
                'name' => $name,
                'school_id' => $school->id,
            ]);
        }

        // 4. Classrooms (الفصول)
        $classrooms = [];
        foreach ($grades as $grade) {
            for ($i = 1; $i <= 3; $i++) {
                $classrooms[] = Classroom::firstOrCreate([
                    'name' => $grade->name.' - فصل '.$i,
                    'grade_id' => $grade->id,
                    'school_id' => $school->id,
                ]);
            }
        }

        // 5. Routes (المسارات)
        $routes = [];
        $routeNames = [
            'شمال الرياض 1', 'شمال الرياض 2', 'جنوب الرياض 1', 'جنوب الرياض 2',
            'شرق الرياض 1', 'شرق الرياض 2', 'غرب الرياض 1', 'غرب الرياض 2',
            'وسط الرياض 1', 'وسط الرياض 2',
        ];
        foreach ($schoolNames as $sIndex => $sName) {
            $currentSchool = $schools[$sIndex];
            foreach ($routeNames as $index => $name) {
                $routes[] = Route::updateOrCreate(
                    [
                        'school_id' => $currentSchool->id,
                        'code' => 'SCH'.$currentSchool->id.'-R'.($index + 1),
                    ],
                    [
                        'name' => $name,
                    ]
                );
            }
        }
        $school = $schools[0];

        // 6. Users creation helper
        $createSystemUser = function ($roleName, $prefix, $index, $nationalId, $customEmail = null) use ($roles, $fakerAr, $fakerEn) {
            $email = $customEmail ?: "{$prefix}{$index}@demo-wasel.com";
            $phone = '968'.substr($nationalId, -9);

            // Try finding by National ID first
            $user = User::where('national_id', $nationalId)->first();

            // If not found by National ID, check if email or phone is already taken by ANOTHER user
            if (! $user) {
                $existingUser = User::where('email', $email)->orWhere('phone', $phone)->first();
                if ($existingUser) {
                    // If email/phone exists, we use this user even if National ID is different, to avoid conflict
                    $user = $existingUser;
                }
            }

            if (! $user) {
                $user = new User;
                $user->password = Hash::make('password');
            }

            $user->fill([
                'national_id' => $nationalId,
                'first_name_ar' => $fakerAr->firstName('male'),
                'last_name_ar' => $fakerAr->lastName,
                'first_name_en' => $fakerEn->firstName('male'),
                'last_name_en' => $fakerEn->lastName,
                'address' => $fakerAr->address,
            ]);

            // Only update email/phone if they are not taken by anyone else
            if (! User::where('email', $email)->where('id', '!=', $user->id)->exists()) {
                $user->email = $email;
            }
            $cleanPhone = '968'.substr($nationalId, -9);
            if (! User::where('phone', $cleanPhone)->where('id', '!=', $user->id)->exists()) {
                $user->phone = $cleanPhone;
            }

            $user->save();

            $user->roles()->syncWithoutDetaching([$roles[$roleName]->id]);

            return $user;
        };

        // 6b. Super Admin (المشرف العام)
        $admin = User::updateOrCreate(
            ['national_id' => '1000000000'],
            [
                'email' => 'admin@wasel.com',
                'first_name_ar' => 'مدير',
                'last_name_ar' => 'مسارات',
                'first_name_en' => 'Super',
                'last_name_en' => 'Masarat',
                'national_id' => '1000000000',
                'password' => Hash::make('password'),
                'phone' => '968500000000',
                'address' => 'المركز الرئيسي - الرياض',
            ]
        );
        $admin->roles()->syncWithoutDetaching([$roles['admin']->id]);

        // 7. Single Field Supervisor (المشرف الميداني الموحد)
        $supervisorUser = $createSystemUser('field_supervisor', 'supervisor', 'main', '1100000000', 'supervisor_demo@demo-wasel.com');
        $mainSupervisor = FieldSupervisor::updateOrCreate(['user_id' => $supervisorUser->id], ['status' => 'active']);

        // 8. Assistants (المشرفات)
        $assistants = [];
        for ($i = 1; $i <= 10; $i++) {
            $nationalId = '12'.str_pad($i, 8, '0', STR_PAD_LEFT);
            $email = "assistant_demo{$i}@demo-wasel.com";
            $phone = '968'.substr($nationalId, -9);

            $user = User::where('national_id', $nationalId)->first();
            if (! $user) {
                $existingUser = User::where('email', $email)->orWhere('phone', $phone)->first();
                if ($existingUser) {
                    $user = $existingUser;
                }
            }

            if (! $user) {
                $user = new User;
                $user->password = Hash::make('password');
            }

            $user->fill([
                'national_id' => $nationalId,
                'first_name_ar' => $fakerAr->firstName('female'),
                'last_name_ar' => $fakerAr->lastName,
                'first_name_en' => $fakerEn->firstName('female'),
                'last_name_en' => $fakerEn->lastName,
                'email' => $email,
                'phone' => '968'.substr($nationalId, -9),
            ]);
            $user->save();

            $user->roles()->syncWithoutDetaching([$roles['assistant']->id]);
            $assistants[] = Assistant::updateOrCreate(['user_id' => $user->id], ['status' => 'active']);
        }

        // 9. Drivers and Buses
        $drivers = [];
        $buses = [];
        for ($i = 1; $i <= 10; $index = $i - 1, $i++) {
            $user = $createSystemUser('driver', 'driver', $i, '13'.str_pad($i, 8, '0', STR_PAD_LEFT));
            $driver = Driver::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'license_number' => 'L-9000000'.$i,
                    'license_expiry_date' => now()->addYears(2),
                    'status' => 'active',
                ]
            );
            $drivers[] = $driver;

            // Create Bus
            $bus = Bus::updateOrCreate(
                ['bus_number' => 'B-'.str_pad($i, 3, '0', STR_PAD_LEFT)],
                [
                    'plate_number' => 'أ ب ج '.(1000 + $i),
                    'capacity' => 25,
                    'model' => 'Mercedes Sprinter',
                    'year' => 2024,
                    'school_id' => $school->id,
                    'assistant_id' => $assistants[$index]->user_id,
                    'field_supervisor_id' => $supervisorUser->id, // All buses linked to the same supervisor
                    'driver_id' => $user->id, // Set the driver ID here
                    'route_id' => $routes[$index]->id,
                    'status' => 'active',
                ]
            );
            $buses[] = $bus;

            // Add some Bus Expenses for each bus
            for ($j = 1; $j <= 5; $j++) {
                \App\Models\BusExpense::create([
                    'bus_id' => $bus->id,
                    'type' => $fakerAr->randomElement(['وقود', 'صيانة', 'تأمين', 'غسيل', 'إصلاح']),
                    'amount' => rand(100, 1500),
                    'date' => now()->subDays(rand(1, 30)),
                    'extra_info' => 'مصاريف دورية مجدولة',
                ]);
            }
        }

        // 10. Guardians and Students (At least 10 children per guardian)
        for ($i = 1; $i <= 10; $i++) {
            $guardianUser = $createSystemUser('parent', 'guardian', $i, '14'.str_pad($i, 8, '0', STR_PAD_LEFT));
            $guardian = Guardian::updateOrCreate(['user_id' => $guardianUser->id], ['status' => 'active']);

            // Create 10 Students for each guardian
            for ($s = 1; $s <= 10; $s++) {
                $gender = ($s % 2 == 0) ? 'female' : 'male';
                $stFirstNameAr = $fakerAr->firstName($gender);
                $stFirstNameEn = $fakerEn->firstName($gender);

                $forthBus = $buses[array_rand($buses)];
                $backBus = (rand(0, 10) > 3) ? $forthBus : $buses[array_rand($buses)];
                $assignedClass = $classrooms[array_rand($classrooms)];

                $student = Student::updateOrCreate(
                    ['student_code' => 'STU-'.$i.'-'.str_pad($s, 2, '0', STR_PAD_LEFT)],
                    [
                        'first_name_ar' => $stFirstNameAr,
                        'last_name_ar' => $guardianUser->last_name_ar,
                        'first_name_en' => $stFirstNameEn,
                        'last_name_en' => $guardianUser->last_name_en,
                        'national_id' => '24'.str_pad($i.$s, 8, '0', STR_PAD_LEFT),
                        'gender' => $gender,
                        'forth_bus_id' => $forthBus->id, // Morning bus
                        'back_bus_id' => $backBus->id,   // Evening bus
                        'is_active' => true,
                    ]
                );

                // Link Student to Guardian
                $student->guardians()->syncWithoutDetaching([
                    $guardianUser->id => ['relationship_type' => 'Father'],
                ]);

                // Enroll student in school and classroom
                $student->enrollments()->updateOrCreate(
                    ['classroom_id' => $assignedClass->id],
                    [
                        'is_active' => true,
                    ]
                );

                // Add Attendance for the last 7 days
                for ($d = 0; $d < 7; $d++) {
                    $attendanceDate = now()->subDays($d);
                    if ($attendanceDate->isWeekend()) {
                        continue;
                    }

                    // Daily Classroom Attendance
                    \App\Models\Attendance::updateOrCreate(
                        [
                            'student_id' => $student->id,
                            'date' => $attendanceDate->format('Y-m-d'),
                        ],
                        [
                            'classroom_id' => $assignedClass->id,
                            'status' => (rand(0, 100) > 5) ? 'present' : (rand(0, 1) ? 'absent' : 'late'),
                        ]
                    );

                    // Trip Attendance (Morning Trip)
                    $trip = \App\Models\Trip::updateOrCreate(
                        [
                            'bus_id' => $forthBus->id,
                            'trip_date' => $attendanceDate->format('Y-m-d'),
                            'type' => 'morning',
                        ],
                        [
                            'driver_id' => $forthBus->driver->user_id ?? $drivers[0]->user_id,
                            'school_id' => $forthBus->school_id,
                            'route_id' => $forthBus->route_id,
                            'status' => 'finished',
                            'departure_time' => $attendanceDate->copy()->setTime(6, 30),
                            'arrival_time' => $attendanceDate->copy()->setTime(7, 30),
                        ]
                    );

                    \App\Models\TripAttendance::updateOrCreate(
                        [
                            'trip_id' => $trip->id,
                            'student_id' => $student->id,
                        ],
                        [
                            'status' => (rand(0, 100) > 2) ? 'boarded' : 'absent',
                            'check_in_time' => $attendanceDate->copy()->setTime(6, rand(45, 59)),
                            'check_out_time' => $attendanceDate->copy()->setTime(7, rand(15, 30)),
                        ]
                    );
                }
            }
        }

        // 11. School Admins (One for each school)
        foreach ($schools as $index => $currentSchool) {
            $targetEmail = ($index === 0) ? 'school@wasel.com' : 'school'.($index + 1).'@demo-wasel.com';
            $schoolAdminUser = $createSystemUser('school_admin', 'school', ($index + 1), '15'.str_pad($index + 1, 8, '0', STR_PAD_LEFT), $targetEmail);

            SchoolAdmin::updateOrCreate(
                ['user_id' => $schoolAdminUser->id],
                ['school_id' => $currentSchool->id, 'status' => 'active']
            );
        }

        // 12. Teachers (One for each grade)
        foreach ($grades as $index => $grade) {
            $teacherUser = $createSystemUser('teacher', 'teacher', ($index + 1), '16'.str_pad($index + 1, 8, '0', STR_PAD_LEFT));
            Teacher::updateOrCreate(
                ['user_id' => $teacherUser->id],
                [
                    'school_id' => $school->id,
                    'grade_id' => $grade->id,
                    'status' => 'active',
                ]
            );
        }

        // 13. Comprehensive Historical Data Generation (Last 30 Days)
        // This ensures the Reports Hub is fully populated with realistic trends
        $allStudents = Student::all();

        foreach ($buses as $bus) {
            for ($d = 0; $d < 30; $d++) {
                $date = now()->subDays($d);
                if ($date->isWeekend()) {
                    continue;
                } // Skip weekends

                // 13a. Inspections (1 per week per bus roughly)
                if (rand(1, 100) <= 15) {
                    $inspection = \App\Models\Inspection::create([
                        'field_supervisor_id' => $supervisorUser->id,
                        'bus_id' => $bus->id,
                        'overall_status' => (rand(1, 100) > 90) ? 'fail' : ((rand(1, 100) > 80) ? 'warning' : 'pass'),
                        'notes' => 'فحص دوري لسلامة الحافلة.',
                        'created_at' => $date->copy()->setTime(rand(8, 14), rand(0, 59)),
                    ]);

                    // Add some inspection items
                    $items = \App\Models\InspectionItem::all();
                    if ($items->count() > 0) {
                        foreach ($items->random(min(5, $items->count())) as $item) {
                            \App\Models\InspectionResult::create([
                                'inspection_id' => $inspection->id,
                                'inspection_item_id' => $item->id,
                                'is_passed' => (rand(1, 100) > 10), // 90% pass rate per item
                                'notes' => (rand(1, 100) > 90) ? 'يحتاج صيانة خفيفة' : null,
                            ]);
                        }
                    }
                }

                // 13b. Violations (Speeding, Traffic - for Speed & Discipline Report)
                if (rand(1, 100) <= 20) { // 20% chance of a violation on any given day for a bus
                    \App\Models\Violation::create([
                        'field_supervisor_id' => $supervisorUser->id,
                        'bus_id' => $bus->id,
                        'type' => (rand(1, 100) > 40) ? 'تجاوز السرعة' : 'وقوف خاطئ',
                        'description' => 'تم رصد مخالفة عبر النظام الآلي أو المشرف الميداني.',
                        'status' => $fakerAr->randomElement(['pending', 'resolved', 'confirmed']),
                        'created_at' => $date->copy()->setTime(rand(6, 16), rand(0, 59)),
                    ]);
                }

                // 13c. Incidents (Safety Report)
                if (rand(1, 100) <= 10) { // 10% chance
                    $severity = (rand(1, 100) > 85) ? 'high' : ((rand(1, 100) > 50) ? 'medium' : 'low');
                    \App\Models\Incident::create([
                        'reporter_id' => $supervisorUser->id,
                        'bus_id' => $bus->id,
                        'type' => $fakerAr->randomElement(['عطل ميكانيكي', 'تأخير غير مبرر', 'مشكلة سلوكية']),
                        'severity' => $severity,
                        'description' => 'تقرير عن حادثة أو مشكلة واجهت الحافلة أثناء المسار.',
                        'status' => $fakerAr->randomElement(['pending', 'resolved', 'investigating']),
                        'created_at' => $date->copy()->setTime(rand(6, 16), rand(0, 59)),
                    ]);
                }

                // 13d. Delays (Delay & Punctuality Report)
                if (rand(1, 100) <= 25) { // 25% chance of SOME delay
                    $delayType = (rand(1, 100) > 40) ? 'bus' : 'student';
                    $duration = rand(5, 45); // 5 to 45 mins

                    \App\Models\Delay::create([
                        'type' => $delayType,
                        'bus_id' => $bus->id,
                        'student_id' => ($delayType === 'student') ? $allStudents->random()->id : null,
                        'duration_minutes' => $duration,
                        'reason' => ($delayType === 'bus') ? $fakerAr->randomElement(['ازدحام مروري', 'عطل بسيط', 'ظروف جوية']) : $fakerAr->randomElement(['تأخر في النزول', 'نسيان أدوات', 'مرض مفاجئ']),
                        'notes' => 'تم توثيق التأخير لإدراجه في التقارير.',
                        'reporter_id' => $supervisorUser->id,
                        'created_at' => $date->copy()->setTime(rand(6, 16), rand(0, 59)),
                    ]);
                }
            }
        }

        $this->command->info('Project Comprehensive Seeding Completed Successfully!');
        $this->command->info('Guardians: 10 (each with 10 students)');
        $this->command->info('Total Students: 100');
        $this->command->info('Buses: 10 (linked to Drivers, Assistants, and Supervisors)');
        $this->command->info('Field Supervisor Actions: Inspections, Violations, and Incidents added.');
    }
}
