<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\School;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1️⃣ Admin عام
        User::factory()->create([
            'name'      => 'General Manager',
            'email'     => 'admin@wasel.com',
            'password'  => Hash::make('password'),
            'role'      => 'admin',
            'user_code' => 'AD-001',
            'phone'     => '966500000001',
            'national_id' => '1000000000',
        ]);

        // 2️⃣ مدرسة
        $school = School::create([
            'name'           => 'مدرسة الأفق العالمية',
            'location'       => 'الرياض',
            'status'         => 'active',
            'has_transport'  => true,
            'has_attendance' => true,
        ]);

        // 3️⃣ School Admin (إيميل مختلف!)
        $schoolAdmin = User::factory()->create([
            'name' => 'School Principal',
            'email' => 'school@wasel.com', // ✅ مختلف
            'password' => Hash::make('password'),
            'role' => 'school_admin',
            'school_id' => $school->id,
            'user_code' => 'SCH-001',
            'phone'     => '966500000002',
            'national_id' => '1000000001',
        ]);

        // 4️⃣ Supervisors (مشرفات للحافلات)
        $supervisors = collect();
        for ($i = 1; $i <= 3; $i++) {
            $supervisors->push(User::factory()->create([
                'name' => "Supervisor $i",
                'email' => "supervisor$i@wasel.com",
                'password' => Hash::make("96651000000$i"),
                'role' => 'supervisor',
                'school_id' => $school->id,
                'user_code' => "SUP-00$i",
                'phone' => "96651000000$i",
                'national_id' => "100000001$i",
            ]));
        }

        // 4.5️⃣ Drivers (سائقين للحافلات)
        $drivers = collect();
        for ($i = 1; $i <= 3; $i++) {
            $drivers->push(User::factory()->create([
                'name' => "Driver $i",
                'email' => "driver$i@wasel.com",
                'password' => Hash::make("96659000000$i"),
                'role' => 'driver',
                'school_id' => $school->id,
                'user_code' => "DRV-00$i",
                'phone' => "96659000000$i",
                'national_id' => "100000002$i",
            ]));
        }

        // 5️⃣ Buses (حافلات)
        $buses = collect();
        foreach ($supervisors as $index => $supervisor) {
            $buses->push(\App\Models\Bus::create([
                'school_id' => $school->id,
                'bus_code' => \App\Models\Bus::generateNextCode(),
                'bus_number' => "B-" . ($index + 1) . "00",
                'plate_number' => "ABC-" . rand(1000, 9999),
                'capacity' => 20,
                'model' => 'Mercedes',
                'year' => 2024,
                'supervisor_id' => $supervisor->id,
                'driver_id' => $drivers[$index]->id, // تعيين السائق
                'status' => 'active',
                'type' => 'permanent',
            ]));
        }

        // 6️⃣ Bus Groups (مجموعات الحافلات)
        $busGroups = collect();
        foreach ($buses as $index => $bus) {
            $busGroups->push(\App\Models\BusGroup::create([
                'school_id' => $school->id,
                'bus_id' => $bus->id,
                'name' => "Group " . ($index + 1),
            ]));
        }

        // 7️⃣ Teachers (معلمين)
        $teachers = collect();
        for ($i = 1; $i <= 3; $i++) {
            $teachers->push(User::factory()->create([
                'name' => "Teacher $i",
                'email' => "teacher$i@wasel.com",
                'password' => Hash::make("96652000000$i"),
                'role' => 'teacher',
                'school_id' => $school->id,
                'user_code' => "TCH-00$i",
                'phone' => "96652000000$i",
                'national_id' => "100000003$i",
            ]));
        }

        // 8️⃣ Classrooms (فصول)
        $classrooms = collect();
        $grades = ['1st Grade', '2nd Grade', '3rd Grade'];
        foreach ($teachers as $index => $teacher) {
            $classroom = \App\Models\Classroom::create([
                'school_id' => $school->id,
                'name' => $grades[$index],
            ]);
            // Attach teacher to classroom
            $classroom->teachers()->attach($teacher->id, ['school_id' => $school->id]);
            $classrooms->push($classroom);
        }

        // 9️⃣ Guardians (أولياء أمور)
        $guardians = collect();
        for ($i = 1; $i <= 5; $i++) {
            $guardians->push(User::factory()->create([
                'name' => "Guardian $i",
                'email' => "guardian$i@wasel.com",
                'password' => Hash::make("96653000000$i"),
                'role' => 'parent', // Assuming 'parent' is the role
                'school_id' => $school->id,
                'user_code' => "GRD-00$i",
                'phone' => "96653000000$i",
                'national_id' => "100200300$i",
            ]));
        }

        // 🔟 Students (طلاب)
        foreach ($guardians as $index => $guardian) {
            // Create 1-2 students per guardian
            $numStudents = rand(1, 2);
            for ($s = 1; $s <= $numStudents; $s++) {
                $group = $busGroups->random();
                $classroom = $classrooms->random();

                $student = \App\Models\Student::create([
                    'school_id' => $school->id,
                    'guardian_id' => $guardian->id,
                    'full_name' => $guardian->name . " Child $s",
                    'full_name_en' => "Child $s of " . $guardian->name,
                    'student_code' => "STU-" . $guardian->id . "-$s",
                    'national_id' => "200300400" . $guardian->id . $s,
                    'gender' => $s % 2 == 0 ? 'female' : 'male',
                    'morning_group_id' => $group->id,
                    'afternoon_group_id' => $group->id,
                    'assigned_supervisor_id' => $classroom->teachers->first()->id, // Just assigning a teacher as supervisor
                    'is_active' => true,
                ]);

                // Enroll Student
                $student->enrollments()->create([
                    'school_id' => $school->id,
                    'classroom_id' => $classroom->id,
                    'status' => 'active',
                    'is_active' => true,
                ]);

                // 12️⃣ Add random dummy attendance records for this student (last 30 days)
                for ($d = 1; $d <= 15; $d++) {
                    $status = rand(0, 10) > 2 ? 'present' : 'absent'; // 80% present, 20% absent
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
    }
}
