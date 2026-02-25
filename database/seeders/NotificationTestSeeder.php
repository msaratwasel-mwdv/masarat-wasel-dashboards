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
        $classroom = Classroom::create([
            'name' => 'فصل النخبة (أ)',
            'grade' => '1',
            'section' => 'A',
            'school_id' => $school->id,
            'teacher_id' => null,
        ]);

        // 3. Create Bus
        $bus = Bus::create([
            'bus_number' => 'WAS-001',
            'bus_code' => 'B001',
            'plate_number' => 'أ ب ج 1234',
            'capacity' => 14,
            'type' => 'permanent',
            'status' => 'active',
            'school_id' => $school->id,
        ]);

        // 4. Create Guardian User
        $parentUser = User::create([
            'name' => 'ولي أمر تجريبي',
            'email' => 'parent@wasel.com',
            'password' => Hash::make('password'),
            'role' => 'guardian',
            'user_code' => 'GD-001',
            'phone' => '966500000003',
            'national_id' => '1000200030',
            // Token is optional but good for testing success/failure logs
            'fcm_token' => 'fcm_token_test_123', 
        ]);

        // 5. Create Guardian Record
        $guardian = Guardian::create([
            'user_id' => $parentUser->id,
            'school_id' => $school->id,
            'name' => $parentUser->name,
            'phone' => $parentUser->phone,
            'national_id' => $parentUser->national_id,
        ]);

        // 6. Create Student
        $student = Student::create([
            'full_name' => 'طالب تجريبي',
            'student_code' => 'ST-001',
            'national_id' => '999888777',
            'gender' => 'male',
            'guardian_id' => $guardian->id,
            'school_id' => $school->id,
            'classroom_id' => $classroom->id,
            'is_active' => true,
        ]);

        // 7. Link Student to Bus
        $bus->students()->attach($student->id, ['is_active' => true]);

        echo "✅ Notification Test Data Seeded Successfuly!\n";
        echo "   Guardian Email: parent@wasel.com\n";
        echo "   Classroom: {$classroom->name}\n";
        echo "   Bus: {$bus->bus_number}\n";
    }
}
