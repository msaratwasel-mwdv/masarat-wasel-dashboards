<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            SchoolSeeder::class,
            UserSeeder::class,
            AssistantSeeder::class,
            ClassroomSeeder::class,
            BusSeeder::class,
            StudentSeeder::class,
            AttendanceSeeder::class,
            InspectionItemsSeeder::class,
            NotificationTemplateSeeder::class,
            NotificationTestSeeder::class,
            TripReportSeeder::class,
        ]);
    }
}
