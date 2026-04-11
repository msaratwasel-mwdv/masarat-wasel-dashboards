<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'admin'],
            ['name' => 'school_admin'],
            ['name' => 'field_supervisor'],
            ['name' => 'driver'],
            ['name' => 'teacher'],
            ['name' => 'assistant'],
            ['name' => 'parent'],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']]);
        }
    }
}
