<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\School;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\Bus;
use App\Models\Classroom;
use App\Models\Role;
use App\Models\FieldSupervisor;
use App\Models\Driver;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class NotificationTestSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Get or Create School
        $school = School::first() ?? School::create([
            'name' => 'مدرسة الأفق العالمية',
            'location' => DB::raw("ST_GeomFromText('POINT(24.7136 46.6753)')"),
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

        // 3. Find or Create Supervisor
        $supervisor = User::where('national_id', '1002004001')->first() 
            ?? User::create([
                'first_name_ar' => 'مشرف',
                'second_name_ar' => 'رقم',
                'third_name_ar' => '1',
                'last_name_ar' => 'الإخطار',
                'first_name_en' => 'Supervisor',
                'second_name_en' => 'Number',
                'third_name_en' => '1',
                'last_name_en' => 'Notify',
                'email' => 'supervisor_notify@wasel.com',
                'password' => Hash::make('password'),
                'national_id' => '1002004001',
                'phone' => '966519999001',
                'is_active' => true,
            ]);
        
        if (!$supervisor->roles()->where('name', 'supervisor')->exists()) {
            $role = Role::firstOrCreate(['name' => 'supervisor']);
            $supervisor->roles()->attach($role->id);
            
            FieldSupervisor::firstOrCreate([
                'user_id' => $supervisor->id,
                'school_id' => $school->id,
            ]);
        }

        // 4. Find or Create Driver
        $driver = User::where('national_id', '1002005001')->first() 
            ?? User::create([
                'first_name_ar' => 'سائق',
                'second_name_ar' => 'رقم',
                'third_name_ar' => '1',
                'last_name_ar' => 'الإخطار',
                'first_name_en' => 'Driver',
                'second_name_en' => 'Number',
                'third_name_en' => '1',
                'last_name_en' => 'Notify',
                'email' => 'driver_notify@wasel.com',
                'password' => Hash::make('password'),
                'national_id' => '1002005001',
                'phone' => '966599999001',
                'is_active' => true,
            ]);

        if (!$driver->roles()->where('name', 'driver')->exists()) {
            $role = Role::firstOrCreate(['name' => 'driver']);
            $driver->roles()->attach($role->id);

            Driver::firstOrCreate([
                'user_id' => $driver->id,
                'school_id' => $school->id,
                'license_number' => 'DRV-LIC-777',
                'license_expiry_date' => now()->addYears(3),
            ]);
        }

        // 5. Find existing bus for supervisor or create new one
        $bus = Bus::where('supervisor_id', $supervisor->id)->first() ?? Bus::create([
            'bus_number' => 'WAS-TEST-777',
                        'plate_number' => 'أ ب ج 777',
            'capacity' => 14,
            'model' => 'Toyota Coaster',
            'year' => 2024,
                        'status' => 'active',
            'school_id' => $school->id,
            'supervisor_id' => $supervisor->id,
            'driver_id' => $driver->id,
        ]);

        $bus->update([
            'bus_number' => 'WAS-TEST-777',
            'driver_id' => $driver->id,
        ]);

        // 7. Create Guardian
        $parentUser = User::where('national_id', '1000200030')->first() ?? User::create([
            'first_name_ar' => 'ولي',
            'second_name_ar' => 'أمر',
            'third_name_ar' => 'تجريبي',
            'last_name_ar' => 'الأول',
            'first_name_en' => 'Guardian',
            'second_name_en' => 'Test',
            'third_name_en' => 'Parent',
            'last_name_en' => 'One',
            'email' => 'parent@wasel.com',
            'password' => Hash::make('password'),
            'phone' => '966500000003',
            'national_id' => '1000200030',
            'is_active' => true,
        ]);

        if (!$parentUser->roles()->where('name', 'parent')->exists()) {
            $role = Role::firstOrCreate(['name' => 'parent']);
            $parentUser->roles()->attach($role->id);
            
            \App\Models\Guardian::firstOrCreate([
                'user_id' => $parentUser->id,
            ]);
        }

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
                'first_name_ar' => $data['name'],
                'second_name_ar' => 'اسم',
                'third_name_ar' => 'ثاني',
                'last_name_ar' => 'أخير',
                'first_name_en' => $data['name_en'],
                'second_name_en' => 'Second',
                'third_name_en' => 'Third',
                'last_name_en' => 'Last',
                'student_code' => "TEST-ST-" . (100 + $index),
                'national_id' => $data['id'],
                'gender' => ($index % 2 == 0) ? 'male' : 'female',
                'forth_bus_id' => $bus->id,
                'back_bus_id' => $bus->id,
                'grade' => 'الثاني الابتدائي',
                'is_active' => true,
                'school_id' => $school->id,
                'guardian_id' => $parentUser->id,
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


