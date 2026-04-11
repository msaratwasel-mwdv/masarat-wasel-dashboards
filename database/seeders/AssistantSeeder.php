<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Assistant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Faker\Factory;

class AssistantSeeder extends Seeder
{
    public function run(): void
    {
        $fakerAr = Factory::create('ar_SA');
        $fakerEn = Factory::create('en_US');

        $role = Role::firstOrCreate(['name' => 'assistant']);

        for ($i = 1; $i <= 3; $i++) {
            $user = User::updateOrCreate(
                ['national_id' => "100000004$i"],
                [
                    'first_name_ar' => $fakerAr->firstName('female'),
                    'second_name_ar' => 'مساعدة',
                    'third_name_ar' => 'الباص',
                    'last_name_ar' => $fakerAr->lastName,
                    'first_name_en' => $fakerEn->firstName('female'),
                    'second_name_en' => 'Bus',
                    'third_name_en' => 'Assistant',
                    'last_name_en' => $fakerEn->lastName,
                    'email' => "assistant$i@wasel.com",
                    'password' => Hash::make('password'),
                    'phone' => "96654000000$i",
                ]
            );
            $user->roles()->syncWithoutDetaching([$role->id]);
            Assistant::updateOrCreate(
                ['user_id' => $user->id],
                ['status' => 'active']
            );
        }
    }
}
