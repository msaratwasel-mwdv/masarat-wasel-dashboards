<?php

namespace Database\Seeders;

use App\Models\Driver;
use App\Models\FieldSupervisor;
use App\Models\Guardian;
use App\Models\Role;
use App\Models\School;
use App\Models\SchoolAdmin;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $fakerAr = \Faker\Factory::create('ar_SA');
        $fakerEn = \Faker\Factory::create('en_US');

        $getNames = function ($gender = null) use ($fakerAr, $fakerEn) {
            return [
                'ar' => [$fakerAr->firstName($gender), $fakerAr->lastName],
                'en' => [$fakerEn->firstName($gender), $fakerEn->lastName],
            ];
        };

        $school = School::first();
        if (! $school) {
            return;
        }

        // 1. System Admin
        $admin = User::updateOrCreate(
            ['national_id' => '1000000000'],
            [
                'first_name_ar' => 'مدير النظام',
                'last_name_ar' => 'مسارات',
                'first_name_en' => 'System Admin',
                'last_name_en' => 'Masarat',
                'email' => 'admin@wasel.com',
                'password' => Hash::make('password'),
                'phone' => '968500000001',
            ]
        );
        $admin->roles()->syncWithoutDetaching([Role::where('name', 'admin')->first()->id]);

        // 2. School Admin
        $sNames = $getNames('male');
        $sAdminUser = User::updateOrCreate(
            ['national_id' => '1000000001'],
            [
                'first_name_ar' => $sNames['ar'][0],
                'last_name_ar' => $sNames['ar'][1],
                'first_name_en' => $sNames['en'][0],
                'last_name_en' => $sNames['en'][1],
                'email' => 'school@wasel.com',
                'password' => Hash::make('password'),
                'phone' => '968500000002',
            ]
        );
        $sAdminUser->roles()->syncWithoutDetaching([Role::where('name', 'school_admin')->first()->id]);
        SchoolAdmin::updateOrCreate(['user_id' => $sAdminUser->id], ['school_id' => $school->id]);

        // 3. Field Supervisors
        for ($i = 1; $i <= 3; $i++) {
            $names = $getNames('male');
            $user = User::updateOrCreate(
                ['national_id' => "100000001$i"],
                [
                    'first_name_ar' => $names['ar'][0],
                    'last_name_ar' => $names['ar'][1],
                    'first_name_en' => $names['en'][0],
                    'last_name_en' => $names['en'][1],
                    'email' => "supervisor$i@wasel.com",
                    'password' => Hash::make('password'),
                    'phone' => "96851000000$i",
                ]
            );
            $user->roles()->syncWithoutDetaching([Role::where('name', 'field_supervisor')->first()->id]);
            FieldSupervisor::updateOrCreate(['user_id' => $user->id], ['status' => 'active']);
        }

        // 4. Drivers
        for ($i = 1; $i <= 3; $i++) {
            $names = $getNames('male');
            $user = User::updateOrCreate(
                ['national_id' => "100000002$i"],
                [
                    'first_name_ar' => $names['ar'][0],
                    'last_name_ar' => $names['ar'][1],
                    'first_name_en' => $names['en'][0],
                    'last_name_en' => $names['en'][1],
                    'email' => "driver$i@wasel.com",
                    'password' => Hash::make('password'),
                    'phone' => "96859000000$i",
                ]
            );
            $user->roles()->syncWithoutDetaching([Role::where('name', 'driver')->first()->id]);
            Driver::updateOrCreate(['user_id' => $user->id], [
                'license_number' => "LIC-00$i",
                'license_expiry_date' => now()->addYears(2),
                'status' => 'active',
            ]);
        }

        // 5. Teachers
        for ($i = 1; $i <= 3; $i++) {
            $names = $getNames('male');
            $user = User::updateOrCreate(
                ['national_id' => "100000003$i"],
                [
                    'first_name_ar' => $names['ar'][0],
                    'last_name_ar' => $names['ar'][1],
                    'first_name_en' => $names['en'][0],
                    'last_name_en' => $names['en'][1],
                    'email' => "teacher$i@wasel.com",
                    'password' => Hash::make('password'),
                    'phone' => "96852000000$i",
                ]
            );
            $user->roles()->syncWithoutDetaching([Role::where('name', 'teacher')->first()->id]);
            Teacher::updateOrCreate(['user_id' => $user->id], ['school_id' => $school->id, 'status' => 'active']);
        }

        // 5b. Assistants
        for ($i = 1; $i <= 3; $i++) {
            $names = $getNames('female');
            $user = User::updateOrCreate(
                ['national_id' => "100000004$i"],
                [
                    'first_name_ar' => $names['ar'][0],
                    'last_name_ar' => $names['ar'][1],
                    'first_name_en' => $names['en'][0],
                    'last_name_en' => $names['en'][1],
                    'email' => "assistant$i@wasel.com",
                    'password' => Hash::make('password'),
                    'phone' => "96854000000$i",
                ]
            );
            $user->roles()->syncWithoutDetaching([Role::where('name', 'assistant')->first()->id]);
            \App\Models\Assistant::updateOrCreate(['user_id' => $user->id], ['status' => 'active']);
        }

        // 6. Guardians
        for ($i = 1; $i <= 5; $i++) {
            $names = $getNames('male');
            $user = User::updateOrCreate(
                ['national_id' => "100200300$i"],
                [
                    'first_name_ar' => $names['ar'][0],
                    'last_name_ar' => $names['ar'][1],
                    'first_name_en' => $names['en'][0],
                    'last_name_en' => $names['en'][1],
                    'email' => "guardian$i@wasel.com",
                    'password' => Hash::make('password'),
                    'phone' => "96853000000$i",
                ]
            );
            $user->roles()->syncWithoutDetaching([Role::where('name', 'parent')->first()->id]);
            Guardian::updateOrCreate(['user_id' => $user->id], ['status' => 'active']);
        }
    }
}
