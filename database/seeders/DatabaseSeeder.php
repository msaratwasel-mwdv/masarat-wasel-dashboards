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
        ]);

        // 2️⃣ مدرسة
        $school = School::create([
            'name'           => 'مدرسة الأفق العالمية',
            'location'       => 'الرياض',
            'status'         => 'active',
            'has_transport'  => true,
            'has_attendance' => true,
        ]);

        // 3️⃣ School Admin
        User::factory()->create([
            'name'      => 'School Principal',
            'email'     => 'school@wasel.com',
            'password'  => Hash::make('password'),
            'role'      => 'school_admin',
            'school_id' => $school->id,
            'user_code' => 'SCH-001',
            'phone'     => '966500000002',
        ]);

        // 4️⃣ بيانات اختبار الإشعارات (ولي أمر + طالب + حافلة)
        $this->call(NotificationTestSeeder::class);
    }
}
