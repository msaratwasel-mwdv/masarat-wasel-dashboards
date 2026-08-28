<?php

namespace Database\Factories;

use App\Models\Bus;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Incident>
 */
class IncidentFactory extends Factory
{
    protected $model = Incident::class;

    public function definition(): array
    {
        return [
            'reporter_id' => User::factory(),
            'bus_id' => Bus::factory(),
            'trip_id' => null,
            'type' => fake()->randomElement(['mechanical', 'traffic', 'medical', 'behavioral', 'other']),
            'severity' => fake()->randomElement(['low', 'medium', 'high', 'critical']),
            'description' => 'تقرير عطل فني في الإطار الأيمن للحافلة',
            'location_lat' => 24.7136,
            'location_lng' => 46.6753,
            'status' => 'open',
            'resolved_by' => null,
            'student_ids' => null,
            'photos' => null,
        ];
    }
}
