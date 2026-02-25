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
            'grade_level' => '1',
            'school_id' => $school->id,
        ]);

        // 3. Create Bus
        $bus = Bus::create([
            'bus_number' => 'WAS-001',
            'bus_code' => 'B001',
            'plate_number' => 'أ ب ج 1234',
            'capacity' => 14,
            'model' => 'Toyota Coaster',
            'year' => 2023,
            'type' => 'permanent',
            'status' => 'active',
            'school_id' => $school->id,
        ]);

        // 3.5 Create Bus Group
        $busGroup = \App\Models\BusGroup::create([
            'name' => 'مجموعة أ',
            'school_id' => $school->id,
            'bus_id' => $bus->id,
        ]);

        // 4. Create Guardian User
        $parentUser = User::create([
            'name' => 'ولي أمر تجريبي',
            'email' => 'parent@wasel.com',
            'password' => Hash::make('password'),
            'role' => 'parent',
            'user_code' => 'GD-001',
            'phone' => '966500000003',
            'national_id' => '1000200030',
            // Token is optional but good for testing success/failure logs
            'fcm_token' => 'fcm_token_test_123', 
        ]);

        // 6. Create Student
        $student = Student::create([
            'full_name' => 'طالب تجريبي',
            'full_name_en' => 'Test Student',
            'student_code' => 'ST-001',
            'national_id' => '999888777',
            'gender' => 'male',
            'guardian_id' => $parentUser->id,
            'school_id' => $school->id,
            'morning_group_id' => $busGroup->id,
            'afternoon_group_id' => $busGroup->id,
            'is_active' => true,
        ]);

        // Enroll Student
        $student->enrollments()->create([
            'school_id' => $school->id,
            'classroom_id' => $classroom->id,
            'status' => 'active',
            'is_active' => true,
        ]);

        echo "✅ Notification Test Data Seeded Successfuly!\n";
        echo "   Guardian Email: parent@wasel.com\n";
        echo "   Classroom: {$classroom->name}\n";
        echo "   Bus: {$bus->bus_number}\n";
    }
}
