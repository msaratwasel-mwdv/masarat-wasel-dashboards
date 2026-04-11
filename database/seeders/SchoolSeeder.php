<?php

namespace Database\Seeders;

use App\Models\School;
use Illuminate\Database\Seeder;

class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        School::firstOrCreate(
            ['name' => 'مدرسة الأفق العالمية'],
            [
                'latitude'       => 24.7136,
                'longitude'      => 46.6753,
                'status'         => 'Active',
                'has_transport'  => true,
                'has_attendance' => true,
            ]
        );

        School::firstOrCreate(
            ['name' => 'مدرسة الرواد النموذجية'],
            [
                'latitude'       => 24.7743,
                'longitude'      => 46.7386,
                'status'         => 'Active',
                'has_transport'  => true,
                'has_attendance' => true,
            ]
        );
    }
}
