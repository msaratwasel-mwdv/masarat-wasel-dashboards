<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\School;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\Bus;
use App\Models\Classroom;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class NotificationTestSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Get or Create School
        $school = School::first() ?? School::create([
            'name' => 'مدرسة الأفق العالمية',
            'location' => 'الرياض',
            'status' => 'active',
            'has_transport' => true,
            'has_attendance' => true,
        ]);

        // 2. Create Classroom
        $classroom = Classroom::first() ?? Classroom::create([
            'name' => 'فصل النخبة (أ)',
            'grade_level' => '1',
            'school_id' => $school->id,
        ]);

        // 3. Find or Create Supervisor (Using existing ID if possible, or predictable one)
        $supervisor = User::where('national_id', '1002004001')->first() ?? User::create([
            'name' => 'Supervisor 1',
            'email' => 'supervisor1@wasel.com',
            'password' => Hash::make('password'),
            'role' => 'supervisor',
            'national_id' => '1002004001',
            'phone' => '966510000001',
            'school_id' => $school->id,
            'is_active' => true,
        ]);

        // 4. Find or Create Driver
        $driver = User::where('national_id', '1002005001')->first() ?? User::create([
            'name' => 'Driver 1',
            'email' => 'driver1@wasel.com',
            'password' => Hash::make('password'),
            'role' => 'driver',
            'national_id' => '1002005001',
            'phone' => '966590000001',
            'school_id' => $school->id,
            'is_active' => true,
        ]);

        // 5. Find existing bus for supervisor or create new one
        $bus = Bus::where('supervisor_id', $supervisor->id)->first() ?? Bus::create([
            'bus_number' => 'WAS-TEST-777',
            'bus_code' => 'TEST777',
            'plate_number' => 'أ ب ج 777',
            'capacity' => 14,
            'model' => 'Toyota Coaster',
            'year' => 2024,
            'type' => 'permanent',
            'status' => 'active',
            'school_id' => $school->id,
            'supervisor_id' => $supervisor->id,
            'driver_id' => $driver->id,
        ]);

        $bus->update([
            'bus_number' => 'WAS-TEST-777',
            'trip_status' => 'to_school', // اجعلها رحلة صباحية افتراضياً للاختبار
            'driver_id' => $driver->id,
        ]);

        // 6. Create Bus Group for this bus
        $busGroup = \App\Models\BusGroup::where('bus_id', $bus->id)->first() ?? \App\Models\BusGroup::create([
            'name' => 'مجموعة الاختبار',
            'school_id' => $school->id,
            'bus_id' => $bus->id,
        ]);

        // 7. Create Guardian
        $parentUser = User::where('national_id', '1000200030')->first() ?? User::create([
            'name' => 'ولي أمر تجريبي',
            'email' => 'parent@wasel.com',
            'password' => Hash::make('password'),
            'role' => 'parent',
            'phone' => '966500000003',
            'national_id' => '1000200030',
            'school_id' => $school->id,
            'is_active' => true,
        ]);

        // 8. Create Multiple Students linked to everything
        $studentsData = [
            ['name' => 'أحمد محمد علي', 'name_en' => 'Ahmed Mohamed Ali', 'id' => '111222333'],
            ['name' => 'سارة عبد الرحمن', 'name_en' => 'Sara Abdulrahman', 'id' => '222333444'],
            ['name' => 'خالد وليد حسن', 'name_en' => 'Khaled Waleed Hassan', 'id' => '333444555'],
            ['name' => 'ريم فهد التميمي', 'name_en' => 'Reem Fahad Al-Tamimi', 'id' => '444555666'],
            ['name' => 'محمد إبراهيم القحطاني', 'name_en' => 'Mohamed Ibrahim Al-Qahtani', 'id' => '555666777'],
            ['name' => 'لجين سمير العتيبي', 'name_en' => 'Lujain Samir Al-Otaibi', 'id' => '666777888'],
            ['name' => 'ياسين يوسف الحربي', 'name_en' => 'Yassin Youssef Al-Harbi', 'id' => '777888999'],
            ['name' => 'نورة عبد العزيز المطيري', 'name_en' => 'Noura Abdulaziz Al-Mutairi', 'id' => '888999000'],
            ['name' => 'حمزة إدريس الغامدي', 'name_en' => 'Hamza Idris Al-Ghamdi', 'id' => '999000111'],
            ['name' => 'طالب الاختبار الفعلي', 'name_en' => 'Real Test Student', 'id' => '777666555'],
        ];

        foreach ($studentsData as $index => $data) {
            $student = Student::create([
                'full_name' => $data['name'],
                'full_name_en' => $data['name_en'],
                'student_code' => "TEST-ST-" . (100 + $index),
                'national_id' => $data['id'],
                'gender' => ($index % 2 == 0) ? 'male' : 'female',
                'guardian_id' => $parentUser->id,
                'school_id' => $school->id,
                'morning_group_id' => $busGroup->id,
                'afternoon_group_id' => $busGroup->id,
                'grade' => 'الثاني الابتدائي',
                'is_active' => true,
            ]);

            // Enroll Student in classroom
            $student->enrollments()->create([
                'school_id' => $school->id,
                'classroom_id' => $classroom->id,
                'status' => 'active',
                'is_active' => true,
            ]);

            // IMPORTANT: Attach student to the bus in the pivot table (used by supervisor app)
            $bus->students()->attach($student->id, [
                'trip_type' => 'both',
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

        echo "✅ Triple-Linked Test Data Seeded Successfully!\n";
        echo "   Total Students Created: " . count($studentsData) . "\n";
        echo "   Supervisor ID: {$supervisor->national_id} | Password: password\n";
        echo "   Guardian ID: {$parentUser->national_id} | Password: password\n";
        echo "   Bus: {$bus->bus_number} | Driver: {$driver->name}\n";
    }
}
