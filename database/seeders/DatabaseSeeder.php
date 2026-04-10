<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\School;
use App\Models\Role;
use App\Models\SchoolAdmin;
use App\Models\FieldSupervisor;
use App\Models\Driver;
use App\Models\Teacher;
use App\Models\Guardian;
use App\Models\Assistant;
use App\Models\Route;
use App\Models\Bus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $fakerAr = \Faker\Factory::create('ar_SA');
        $fakerEn = \Faker\Factory::create('en_US');

        // Helper to generate 4-part names
        $getNames = function($gender = null) use ($fakerAr, $fakerEn) {
            return [
                'ar' => [
                    $fakerAr->firstName($gender),
                    $fakerAr->firstName('male'),
                    $fakerAr->firstName('male'),
                    $fakerAr->lastName,
                ],
                'en' => [
                    $fakerEn->firstName($gender),
                    $fakerEn->firstName('male'),
                    $fakerEn->firstName('male'),
                    $fakerEn->lastName,
                ]
            ];
        };

        // 0️⃣ تهيئة الأدوار (Roles Initialization)
        $roles = [
            'admin' => Role::firstOrCreate(['name' => 'admin']),
            'school_admin' => Role::firstOrCreate(['name' => 'school_admin']),
            'supervisor' => Role::firstOrCreate(['name' => 'supervisor']),
            'driver' => Role::firstOrCreate(['name' => 'driver']),
            'teacher' => Role::firstOrCreate(['name' => 'teacher']),
            'parent' => Role::firstOrCreate(['name' => 'parent']),
        ];

        // 1️⃣ Admin عام
        $adminNames = $getNames('male');
        $admin = User::updateOrCreate(
            ['national_id' => '1000000000'],
            [
                'first_name_ar' => 'مدير',
                'second_name_ar' => 'عام',
                'third_name_ar' => 'النظام',
                'last_name_ar' => 'مسارات',
                'first_name_en' => 'General',
                'second_name_en' => 'System',
                'third_name_en' => 'Admin',
                'last_name_en' => 'Masarat',
                'email'     => 'admin@wasel.com',
                'password'  => Hash::make('password'),
                'phone'     => '966500000001',
            ]
        );
        $admin->roles()->syncWithoutDetaching([$roles['admin']->id]);

        // 2️⃣ مدرسة
        $school = School::firstOrCreate(
            ['name' => 'مدرسة الأفق العالمية'],
            [
                'latitude'       => 24.7136,
                'longitude'      => 46.6753,
                'status'         => 'Active',
                'has_transport'  => true,
                'has_attendance' => true,
            ]
        );

        // 3️⃣ School Admin
        $sAdminNames = $getNames('male');
        $schoolAdminUser = User::updateOrCreate(
            ['national_id' => '1000000001'],
            [
                'first_name_ar' => $sAdminNames['ar'][0],
                'second_name_ar' => $sAdminNames['ar'][1],
                'third_name_ar' => $sAdminNames['ar'][2],
                'last_name_ar' => $sAdminNames['ar'][3],
                'first_name_en' => $sAdminNames['en'][0],
                'second_name_en' => $sAdminNames['en'][1],
                'third_name_en' => $sAdminNames['en'][2],
                'last_name_en' => $sAdminNames['en'][3],
                'email' => 'school@wasel.com',
                'password' => Hash::make('password'),
                'phone'     => '966500000002',
            ]
        );
        $schoolAdminUser->roles()->syncWithoutDetaching([$roles['school_admin']->id]);
        
        SchoolAdmin::firstOrCreate([
            'user_id' => $schoolAdminUser->id,
            'school_id' => $school->id,
        ]);

        // 4️⃣ Supervisors
        $supervisors = collect();
        for ($i = 1; $i <= 3; $i++) {
            $supNames = $getNames('male');
            $supervisorUser = User::updateOrCreate(
                ['national_id' => "100000001$i"],
                [
                    'first_name_ar' => $supNames['ar'][0],
                    'second_name_ar' => $supNames['ar'][1],
                    'third_name_ar' => $supNames['ar'][2],
                    'last_name_ar' => $supNames['ar'][3],
                    'first_name_en' => $supNames['en'][0],
                    'second_name_en' => $supNames['en'][1],
                    'third_name_en' => $supNames['en'][2],
                    'last_name_en' => $supNames['en'][3],
                    'email' => "supervisor$i@wasel.com",
                    'password' => Hash::make("password"),
                    'phone' => "96651000000$i",
                ]
            );
            $supervisorUser->roles()->syncWithoutDetaching([$roles['supervisor']->id]);
            
            FieldSupervisor::firstOrCreate([
                'user_id' => $supervisorUser->id,
            ], [
                'school_id' => $school->id,
                'status' => 'active',
            ]);
            
            $supervisors->push($supervisorUser);
        }

        // 4.5️⃣ Drivers
        $drivers = collect();
        for ($i = 1; $i <= 3; $i++) {
            $drNames = $getNames('male');
            $driverUser = User::updateOrCreate(
                ['national_id' => "100000002$i"],
                [
                    'first_name_ar' => $drNames['ar'][0],
                    'second_name_ar' => $drNames['ar'][1],
                    'third_name_ar' => $drNames['ar'][2],
                    'last_name_ar' => $drNames['ar'][3],
                    'first_name_en' => $drNames['en'][0],
                    'second_name_en' => $drNames['en'][1],
                    'third_name_en' => $drNames['en'][2],
                    'last_name_en' => $drNames['en'][3],
                    'email' => "driver$i@wasel.com",
                    'password' => Hash::make("password"),
                    'phone' => "96659000000$i",
                ]
            );
            $driverUser->roles()->syncWithoutDetaching([$roles['driver']->id]);
            
            $driver = Driver::firstOrCreate([
                'user_id' => $driverUser->id,
            ], [
                'school_id' => $school->id,
                'license_number' => "LIC-00$i",
                'license_expiry_date' => now()->addYears(2),
                'status' => 'active',
                'bus_id' => null, // Will set below after buses are created
            ]);
            
            $drivers->push($driver);
        }

        // 5️⃣ Buses (حافلات) & Route creation
        $buses = collect();
        $routes = collect();
        foreach ($supervisors as $index => $supervisor) {
            $route = Route::firstOrCreate([
                'name' => "المسار رقم " . ($index + 1),
                'code' => "R-" . ($index + 1),
            ]);
            $routes->push($route);

            $bus = Bus::firstOrCreate([
                'bus_number' => "B-" . ($index + 1) . "00",
            ], [
                'school_id' => $school->id,
                'plate_number' => "ABC-" . rand(1000, 9999),
                'capacity' => 20,
                'model' => 'Mercedes',
                'year' => 2024,
                'field_supervisor_id' => $supervisor->id, // Assigned directly correctly to field supervisor
                'assistant_id' => null,
                'route_id' => $route->id,
                'status' => 'active',
            ]);
            
            // Link the driver's bus_id to this bus
            $drivers[$index]->update(['bus_id' => $bus->id]);

            $buses->push($bus);
        }

        // 7️⃣ Teachers
        $teachers = collect();
        for ($i = 1; $i <= 3; $i++) {
            $tNames = $getNames('male'); // Or 'female'
            $teacherUser = User::updateOrCreate(
                ['national_id' => "100000003$i"],
                [
                    'first_name_ar' => $tNames['ar'][0],
                    'second_name_ar' => $tNames['ar'][1],
                    'third_name_ar' => $tNames['ar'][2],
                    'last_name_ar' => $tNames['ar'][3],
                    'first_name_en' => $tNames['en'][0],
                    'second_name_en' => $tNames['en'][1],
                    'third_name_en' => $tNames['en'][2],
                    'last_name_en' => $tNames['en'][3],
                    'email' => "teacher$i@wasel.com",
                    'password' => Hash::make("password"),
                    'phone' => "96652000000$i",
                ]
            );
            $teacherUser->roles()->syncWithoutDetaching([$roles['teacher']->id]);
            $teachers->push($teacherUser);
        }

        // 8️⃣ Classrooms
        $classrooms = collect();
        $gradesAr = ['الصف الأول', 'الصف الثاني', 'الصف الثالث'];
        foreach ($teachers as $index => $teacher) {
            $classroom = \App\Models\Classroom::firstOrCreate([
                'school_id' => $school->id,
                'name' => $gradesAr[$index] ?? "الصف $index",
            ]);
            
            Teacher::firstOrCreate([
                'user_id' => $teacher->id,
            ], [
                'classroom_id' => $classroom->id,
            ]);
            $classrooms->push($classroom);
        }

        // 9️⃣ Guardians
        $guardians = collect();
        for ($i = 1; $i <= 5; $i++) {
            $gNames = $getNames('male');
            $guardianUser = User::updateOrCreate(
                ['national_id' => "100200300$i"],
                [
                    'first_name_ar' => $gNames['ar'][0],
                    'second_name_ar' => $gNames['ar'][1],
                    'third_name_ar' => $gNames['ar'][2],
                    'last_name_ar' => $gNames['ar'][3],
                    'first_name_en' => $gNames['en'][0],
                    'second_name_en' => $gNames['en'][1],
                    'third_name_en' => $gNames['en'][2],
                    'last_name_en' => $gNames['en'][3],
                    'email' => "guardian$i@wasel.com",
                    'password' => Hash::make("password"),
                    'phone' => "96653000000$i",
                ]
            );
            $guardianUser->roles()->syncWithoutDetaching([$roles['parent']->id]);
            
            Guardian::firstOrCreate([
                'user_id' => $guardianUser->id,
            ]);
            
            $guardians->push($guardianUser);
        }

        // 🔟 Students (طلاب)
        foreach ($guardians as $index => $guardian) {
            $numStudents = rand(1, 2);
            for ($s = 1; $s <= $numStudents; $s++) {
                $assignedBus = $buses->random();
                $classroom = $classrooms->random();

                $gender = $s % 2 == 0 ? 'female' : 'male';
                $stNames = $getNames($gender);
                
                // Inherit the father's name info for the last parts
                $student = \App\Models\Student::updateOrCreate(
                    ['national_id' => "20030040" . $guardian->id . $s],
                    [
                        'first_name_ar' => $stNames['ar'][0],
                        'second_name_ar' => $guardian->first_name_ar,
                        'third_name_ar' => $guardian->second_name_ar,
                        'last_name_ar' => $guardian->last_name_ar,
                        'first_name_en' => $stNames['en'][0],
                        'second_name_en' => $guardian->first_name_en,
                        'third_name_en' => $guardian->second_name_en,
                        'last_name_en' => $guardian->last_name_en,
                        
                        'student_code' => "STU-" . $guardian->id . "-$s",
                        'gender' => $gender,
                        'forth_bus_id' => $assignedBus->id,
                        'back_bus_id' => $assignedBus->id,
                        'is_active' => true,
                    ]
                );

                // Attach Pivot table logic
                $student->guardians()->syncWithoutDetaching([
                    $guardian->id => ['relationship_type' => 'father'] // Assuming user_id maps cleanly in pivot 
                ]);

                // Enroll Student
                $student->enrollments()->firstOrCreate([
                    'classroom_id' => $classroom->id,
                    'is_active' => true,
                ]);

                // Attendance logic test
                for ($d = 1; $d <= 15; $d++) {
                    $status = rand(0, 10) > 2 ? 'present' : 'absent';
                    $randomDate = \Carbon\Carbon::now()->subDays(rand(0, 30));
                    
                    \App\Models\Attendance::firstOrCreate([
                        'student_id' => $student->id,
                        'date' => $randomDate->format('Y-m-d'),
                    ], [
                        'classroom_id' => $classroom->id,
                        'status' => $status
                    ]);
                }
            }
        }

        // 11️⃣ Notification Test Seeder
        $this->call(NotificationTestSeeder::class);

        // 12️⃣ Inspection Items Seeder
        $this->call(InspectionItemsSeeder::class);

        // 13️⃣ Trip Report Test Data
        $this->call(TripReportSeeder::class);
    }
}
