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
use Illuminate\Support\Str;

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

        // 2. School
        $school = School::firstOrCreate(
            ['name' => 'مدرسة مسارات الأهلية'],
            [
                'address' => 'الرياض، المملكة العربية السعودية',
                'status' => 'Active',
                'has_transport' => true,
                'has_attendance' => true,
            ]
        );

        // 3. Grades (المراحل الدراسية)
        $gradeNames = ['المرحلة الابتدائية', 'المرحلة المتوسطة', 'المرحلة الثانوية'];
        $grades = [];
        foreach ($gradeNames as $name) {
            $grades[] = Grade::firstOrCreate([
                'name' => $name,
                'school_id' => $school->id
            ]);
        }

        // 4. Classrooms (الفصول)
        $classrooms = [];
        foreach ($grades as $grade) {
            for ($i = 1; $i <= 3; $i++) {
                $classrooms[] = Classroom::firstOrCreate([
                    'name' => $grade->name . ' - فصل ' . $i,
                    'grade_id' => $grade->id,
                    'school_id' => $school->id
                ]);
            }
        }

        // 5. Routes (المسارات)
        $routes = [];
        $routeNames = [
            'شمال الرياض 1', 'شمال الرياض 2', 'جنوب الرياض 1', 'جنوب الرياض 2',
            'شرق الرياض 1', 'شرق الرياض 2', 'غرب الرياض 1', 'غرب الرياض 2',
            'وسط الرياض 1', 'وسط الرياض 2'
        ];
        foreach ($routeNames as $index => $name) {
            $routes[] = Route::firstOrCreate([
                'school_id' => $school->id,
                'name' => $name,
                'code' => 'R-' . ($index + 1)
            ]);
        }

        // 6. Users creation helper
        $createSystemUser = function($roleName, $prefix, $index, $nationalId) use ($school, $roles, $fakerAr, $fakerEn) {
            $user = User::updateOrCreate(
                ['national_id' => $nationalId],
                [
                    'first_name_ar' => $fakerAr->firstName('male'),
                    'second_name_ar' => $fakerAr->firstName('male'),
                    'third_name_ar' => $fakerAr->firstName('male'),
                    'last_name_ar' => $fakerAr->lastName,
                    'first_name_en' => $fakerEn->firstName('male'),
                    'second_name_en' => $fakerEn->firstName('male'),
                    'third_name_en' => $fakerEn->firstName('male'),
                    'last_name_en' => $fakerEn->lastName,
                    'email' => "{$prefix}{$index}@wasel.com",
                    'password' => Hash::make('password'),
                    'phone' => '966' . substr($nationalId, -9),
                    'address' => $fakerAr->address,
                ]
            );
            $user->roles()->syncWithoutDetaching([$roles[$roleName]->id]);
            return $user;
        };

        // 6b. Super Admin (المشرف العام)
        $admin = User::updateOrCreate(
            ['national_id' => '1000000000'],
            [
                'email' => 'admin@wasel.com',
                'first_name_ar' => 'مدير',
                'second_name_ar' => 'عام',
                'third_name_ar' => 'النظام',
                'last_name_ar' => 'مسارات',
                'first_name_en' => 'Super',
                'second_name_en' => 'Admin',
                'third_name_en' => 'System',
                'last_name_en' => 'Masarat',
                'national_id' => '1000000000',
                'password' => Hash::make('password'),
                'phone' => '966500000000',
                'address' => 'المركز الرئيسي - الرياض',
            ]
        );
        $admin->roles()->syncWithoutDetaching([$roles['admin']->id]);

        // 7. Single Field Supervisor (المشرف الميداني الموحد)
        $supervisorUser = $createSystemUser('field_supervisor', 'supervisor', '', '1100000000');
        // Standardize email
        $supervisorUser->update(['email' => 'supervisor@wasel.com']);
        $mainSupervisor = FieldSupervisor::updateOrCreate(['user_id' => $supervisorUser->id], ['status' => 'active']);

        // 8. Assistants (المشرفات)
        $assistants = [];
        for ($i = 1; $i <= 10; $i++) {
            $nationalId = '12' . str_pad($i, 8, '0', STR_PAD_LEFT);
            $user = User::updateOrCreate(
                ['national_id' => $nationalId],
                [
                    'first_name_ar' => $fakerAr->firstName('female'),
                    'second_name_ar' => $fakerAr->firstName('male'),
                    'third_name_ar' => $fakerAr->firstName('male'),
                    'last_name_ar' => $fakerAr->lastName,
                    'first_name_en' => $fakerEn->firstName('female'),
                    'second_name_en' => $fakerEn->firstName('male'),
                    'third_name_en' => $fakerEn->firstName('male'),
                    'last_name_en' => $fakerEn->lastName,
                    'email' => "assistant{$i}@wasel.com",
                    'password' => Hash::make('password'),
                    'phone' => '966' . substr($nationalId, -9),
                ]
            );
            $user->roles()->syncWithoutDetaching([$roles['assistant']->id]);
            $assistants[] = Assistant::updateOrCreate(['user_id' => $user->id], ['status' => 'active']);
        }

        // 9. Drivers and Buses
        $drivers = [];
        $buses = [];
        for ($i = 1; $i <= 10; $index = $i-1, $i++) {
            $user = $createSystemUser('driver', 'driver', $i, '13' . str_pad($i, 8, '0', STR_PAD_LEFT));
            $driver = Driver::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'license_number' => 'L-9000000' . $i,
                    'license_expiry_date' => now()->addYears(2),
                    'status' => 'active'
                ]
            );
            $drivers[] = $driver;

            // Create Bus
            $bus = Bus::updateOrCreate(
                ['bus_number' => 'B-' . str_pad($i, 3, '0', STR_PAD_LEFT)],
                [
                    'plate_number' => 'أ ب ج ' . (1000 + $i),
                    'capacity' => 25,
                    'model' => 'Mercedes Sprinter',
                    'year' => 2024,
                    'school_id' => $school->id,
                    'assistant_id' => $assistants[$index]->user_id,
                    'field_supervisor_id' => $supervisorUser->id, // All buses linked to the same supervisor
                    'route_id' => $routes[$index]->id,
                    'status' => 'active',
                ]
            );
            $buses[] = $bus;
            
            // Link driver to bus
            $driver->update(['bus_id' => $bus->id]);
        }

        // 10. Guardians and Students (At least 10 children per guardian)
        for ($i = 1; $i <= 10; $i++) {
            $guardianUser = $createSystemUser('parent', 'guardian', $i, '14' . str_pad($i, 8, '0', STR_PAD_LEFT));
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
                    ['student_code' => "STU-" . $i . "-" . str_pad($s, 2, '0', STR_PAD_LEFT)],
                    [
                        'first_name_ar' => $stFirstNameAr,
                        'second_name_ar' => $guardianUser->first_name_ar,
                        'third_name_ar' => $guardianUser->second_name_ar,
                        'last_name_ar' => $guardianUser->last_name_ar,
                        'first_name_en' => $stFirstNameEn,
                        'second_name_en' => $guardianUser->first_name_en,
                        'third_name_en' => $guardianUser->second_name_en,
                        'last_name_en' => $guardianUser->last_name_en,
                        'national_id' => '24' . str_pad($i . $s, 8, '0', STR_PAD_LEFT),
                        'gender' => $gender,
                        'forth_bus_id' => $forthBus->id, // Morning bus
                        'back_bus_id' => $backBus->id,   // Evening bus
                        'is_active' => true,
                    ]
                );

                // Link Student to Guardian
                $student->guardians()->syncWithoutDetaching([
                    $guardianUser->id => ['relationship_type' => 'Father']
                ]);

                // Enroll student in school and classroom
                $student->enrollments()->updateOrCreate(
                    ['classroom_id' => $assignedClass->id],
                    [
                        'is_active' => true,
                    ]
                );
            }
        }

        // 11. School Admin
        $schoolAdminUser = $createSystemUser('school_admin', 'school', '', '15' . str_pad(1, 8, '0', STR_PAD_LEFT));
        // Remove the trailing empty index part for school email
        $schoolAdminUser->update(['email' => 'school@wasel.com']);
        
        SchoolAdmin::updateOrCreate(
            ['user_id' => $schoolAdminUser->id],
            ['school_id' => $school->id, 'status' => 'active']
        );

        // 12. Teachers (One for each grade)
        foreach ($grades as $index => $grade) {
            $teacherUser = $createSystemUser('teacher', 'teacher', ($index + 1), '16' . str_pad($index + 1, 8, '0', STR_PAD_LEFT));
            Teacher::updateOrCreate(
                ['user_id' => $teacherUser->id],
                [
                    'school_id' => $school->id,
                    'grade_id' => $grade->id,
                    'status' => 'active'
                ]
            );
        }

        // 13. Inspections and Violations for the SINGLE Field Supervisor
        foreach ($buses as $bus) {
            // Create an Inspection
            $inspection = \App\Models\Inspection::create([
                'field_supervisor_id' => $supervisorUser->id,
                'bus_id' => $bus->id,
                'overall_status' => (rand(0, 10) > 8) ? 'fail' : 'pass',
                'notes' => 'فحص دوري روتيني للسلامة والتأكد من التجهيزات.',
            ]);

            // Create a Violation for some buses
            if (rand(0, 10) > 7) {
                \App\Models\Violation::create([
                    'field_supervisor_id' => $supervisorUser->id,
                    'bus_id' => $bus->id,
                    'type' => 'تجاوز السرعة',
                    'description' => 'تم رصد تجاوز للسرعة المحددة بالقرب من منطقة المدرسة.',
                    'status' => 'pending',
                ]);
            }

            // Create an Incident reported by supervisor
            if (rand(0, 10) > 8) {
                \App\Models\Incident::create([
                    'reporter_id' => $supervisorUser->id,
                    'bus_id' => $bus->id,
                    'type' => 'عطل ميكانيكي',
                    'severity' => 'medium',
                    'description' => 'تعطل مفاجئ في المحرك أثناء العودة.',
                    'status' => 'pending',
                ]);
            }
        }

        $this->command->info('Project Comprehensive Seeding Completed Successfully!');
        $this->command->info('Guardians: 10 (each with 10 students)');
        $this->command->info('Total Students: 100');
        $this->command->info('Buses: 10 (linked to Drivers, Assistants, and Supervisors)');
        $this->command->info('Field Supervisor Actions: Inspections, Violations, and Incidents added.');
    }
}
