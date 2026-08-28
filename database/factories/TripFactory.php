<?php

namespace Database\Factories;

use App\Models\Bus;
use App\Models\School;
use App\Models\Trip;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Trip>
 */
class TripFactory extends Factory
{
    protected $model = Trip::class;

    public function definition(): array
    {
        return [
            'bus_id' => Bus::factory(),
            'trip_date' => now()->toDateString(),
            'type' => fake()->randomElement(['forth', 'back']),
            'video_check' => false,
            'video_path' => null,
            'departure_time' => now(),
            'arrival_time' => null,
            'status' => 'pending',
            'school_id' => School::factory(),
            'driver_id' => null,
            'route_id' => null,
            'generation_type' => 'manual',
            'cancellation_reason' => null,
            'cancelled_by' => null,
        ];
    }

    public function inProgress(): static
    {
        return $this->state(fn () => [
            'status' => 'in_progress',
            'departure_time' => now(),
        ]);
    }

    public function finished(): static
    {
        return $this->state(fn () => [
            'status' => 'finished',
            'departure_time' => now()->subHour(),
            'arrival_time' => now(),
        ]);
    }
}
