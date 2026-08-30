<?php

namespace Database\Seeders;

use App\Models\School;
use Illuminate\Database\Seeder;

class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        $plusPlan = \App\Models\Plan::where('name', 'Plus')->first();

        $school1 = School::firstOrCreate(
            ['name' => 'مدرسة الأفق العالمية'],
            [
                'latitude' => 24.7136,
                'longitude' => 46.6753,
                'status' => 'Active',
            ]
        );

        \App\Models\Subscription::create([
            'school_id' => $school1->id,
            'plan_id' => $plusPlan->id,
            'status' => 'active',
            'start_date' => now(),
            'end_date' => now()->addYear(),
        ]);

        $school2 = School::firstOrCreate(
            ['name' => 'مدرسة الرواد النموذجية'],
            [
                'latitude' => 24.7743,
                'longitude' => 46.7386,
                'status' => 'Active',
            ]
        );

        \App\Models\Subscription::create([
            'school_id' => $school2->id,
            'plan_id' => $plusPlan->id,
            'status' => 'active',
            'start_date' => now(),
            'end_date' => now()->addYear(),
        ]);
    }
}
