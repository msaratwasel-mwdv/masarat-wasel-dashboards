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
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
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
        $admin = User::updateOrCreate(
            ['national_id' => '1000000000'],
            [
                'first_name_ar' => 'مدير',
                'second_name_ar' => 'عام',
                'third_name_ar' => 'النظام',
                'last_name_ar' => 'الأكبر',
                'first_name_en' => 'General',
                'second_name_en' => 'System',
                'third_name_en' => 'Manager',
                'last_name_en' => 'Admin',
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
                'location'       => DB::raw("ST_GeomFromText('POINT(24.7136 46.6753)')"),
                'status'         => 'active',
                'has_transport'  => true,
                'has_attendance' => true,
            ]
        );

        // 3️⃣ School Admin
        $schoolAdminUser = User::updateOrCreate(
            ['national_id' => '1000000001'],
            [
                'first_name_ar' => 'مدير',
                'second_name_ar' => 'المدرسة',
                'third_name_ar' => 'الأول',
                'last_name_ar' => 'التجريبي',
                'first_name_en' => 'School',
                'second_name_en' => 'Admin',
                'third_name_en' => 'First',
                'last_name_en' => 'Test',
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
            $supervisorUser = User::updateOrCreate(
                ['national_id' => "100000001$i"],
                [
                    'first_name_ar' => "مشرف",
                    'second_name_ar' => "رقم",
                    'third_name_ar' => "$i",
                    'last_name_ar' => "التجريبي",
                    'first_name_en' => "Supervisor",
                    'second_name_en' => "Number",
                    'third_name_en' => "$i",
                    'last_name_en' => "Test",
                    'email' => "supervisor$i@wasel.com",
                    'password' => Hash::make("96651000000$i"),
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
            $driverUser = User::updateOrCreate(
                ['national_id' => "100000002$i"],
                [
                    'first_name_ar' => "سائق",
                    'second_name_ar' => "رقم",
                    'third_name_ar' => "$i",
                    'last_name_ar' => "التجريبي",
                    'first_name_en' => "Driver",
                    'second_name_en' => "Number",
                    'third_name_en' => "$i",
                    'last_name_en' => "Test",
                    'email' => "driver$i@wasel.com",
                    'password' => Hash::make("96659000000$i"),
                    'phone' => "96659000000$i",
                ]
            );
            $driverUser->roles()->syncWithoutDetaching([$roles['driver']->id]);
            
            Driver::firstOrCreate([
                'user_id' => $driverUser->id,
            ], [
                'school_id' => $school->id,
                'license_number' => "LIC-00$i",
                'license_expiry_date' => now()->addYears(2),
                'status' => 'active',
            ]);
            
            $drivers->push($driverUser);
        }

        // 5️⃣ Buses (حافلات)
        $buses = collect();
        foreach ($supervisors as $index => $supervisor) {
            $buses->push(\App\Models\Bus::firstOrCreate([
                'bus_number' => "B-" . ($index + 1) . "00",
            ], [
                'school_id' => $school->id,
                'plate_number' => "ABC-" . rand(1000, 9999),
                'capacity' => 20,
                'model' => 'Mercedes',
                'year' => 2024,
                'supervisor_id' => $supervisor->id,
                'driver_id' => $drivers[$index]->id,
                'status' => 'active',
            ]));
        }

        // 6️⃣ Routes
        $routes = collect();
        foreach ($buses as $bus) {
            $route = Route::firstOrCreate([
                'name' => "Route for Bus " . $bus->bus_number,
                'code' => "R-" . $bus->id,
            ]);
            $bus->update(['route_id' => $route->id]);
            $routes->push($route);
        }

        // 7️⃣ Teachers
        $teachers = collect();
        for ($i = 1; $i <= 3; $i++) {
            $teacherUser = User::updateOrCreate(
                ['national_id' => "100000003$i"],
                [
                    'first_name_ar' => "معلم",
                    'second_name_ar' => "رقم",
                    'third_name_ar' => "$i",
                    'last_name_ar' => "التجريبي",
                    'first_name_en' => "Teacher",
                    'second_name_en' => "Number",
                    'third_name_en' => "$i",
                    'last_name_en' => "Test",
                    'email' => "teacher$i@wasel.com",
                    'password' => Hash::make("96652000000$i"),
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
            $guardianUser = User::updateOrCreate(
                ['national_id' => "100200300$i"],
                [
                    'first_name_ar' => "ولي",
                    'second_name_ar' => "أمر",
                    'third_name_ar' => "رقم",
                    'last_name_ar' => "$i",
                    'first_name_en' => "Guardian",
                    'second_name_en' => "Parent",
                    'third_name_en' => "Number",
                    'last_name_en' => "$i",
                    'email' => "guardian$i@wasel.com",
                    'password' => Hash::make("96653000000$i"),
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

                $student = \App\Models\Student::updateOrCreate(
                    ['national_id' => "20030040" . $guardian->id . $s],
                    [
                        'first_name_ar' => "طالب",
                        'second_name_ar' => "رقم",
                        'third_name_ar' => "$index",
                        'last_name_ar' => "$s",
                        'first_name_en' => "Student",
                        'second_name_en' => "No",
                        'third_name_en' => "$index",
                        'last_name_en' => "$s",
                        'student_code' => "STU-" . $guardian->id . "-$s",
                        'gender' => $s % 2 == 0 ? 'female' : 'male',
                        'forth_bus_id' => $assignedBus->id,
                        'back_bus_id' => $assignedBus->id,
                        'is_active' => true,
                        'guardian_id' => $guardian->id, // Added based on context
                        'school_id' => $school->id, // Added based on context
                    ]
                );

                // Enroll Student
                $student->enrollments()->firstOrCreate([
                    'school_id' => $school->id,
                    'classroom_id' => $classroom->id,
                    'is_active' => true,
                ], [
                    'status' => 'active',
                ]);

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

