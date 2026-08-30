<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminOnlySeeder extends Seeder
{
    /**
     * Seed only the system roles, subscription plans, and the Super Admin user.
     */
    public function run(): void
    {
        // 1. Roles
        $this->call(RoleSeeder::class);

        // 2. Subscription Plans
        $this->call(PlanSeeder::class);

        // 3. Super Admin User
        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'مدير النظام']);

        $admin = User::updateOrCreate(
            ['email' => 'admin@wasel.com'],
            [
                'national_id' => '1000000000',
                'first_name_ar' => 'مدير النظام',
                'last_name_ar' => 'مسارات',
                'first_name_en' => 'System Admin',
                'last_name_en' => 'Masarat',
                'phone' => '968500000001',
                'password' => Hash::make('password'),
                'is_whatsapp_active' => true,
            ]
        );

        $admin->roles()->sync([$adminRole->id]);

        $this->command->info('Super Admin seeded successfully: admin@wasel.com / password');
    }
}
