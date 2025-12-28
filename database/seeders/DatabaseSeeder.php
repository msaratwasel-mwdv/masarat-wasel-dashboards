<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\School; // تأكد من استدعاء المودل
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. إنشاء حساب "مدير الشركة" (أنت)
        User::factory()->create([
            'name' => 'General Manager',
            'email' => 'admin@wasel.com',
            'password' => Hash::make('password'), // كلمة المرور
            'role' => 'admin',
            'user_code' => 'AD-001',
            'phone' => '966500000001',
        ]);

        // 2. إنشاء بيانات مدرسة تجريبية (للتأكد أن صفحة Index تعمل)
        School::create([
            'name' => 'مدرسة الأفق العالمية',
            'location' => 'الرياض',
            'status' => 'Active',
            'has_transport' => true,
            'has_attendance' => true,
        ]);

        // 3. إنشاء حساب "مدير مدرسة" (لصديقك ليجرب لاحقاً)
        User::factory()->create([
            'name' => 'School Principal',
            'email' => 'school@wasel.com',
            'password' => Hash::make('password'),
            'role' => 'school_admin',
            'school_id' => 1, // يتبع المدرسة الأولى
            'user_code' => 'SCH-001',
            'phone' => '966500000002',
        ]);
    }
}
