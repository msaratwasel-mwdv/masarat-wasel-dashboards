<?php

namespace Database\Factories;

use App\Models\Bus;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Bus>
 */
class BusFactory extends Factory
{
    protected $model = Bus::class;

    public function definition(): array
    {
        return [
            'bus_number' => 'BUS-'.fake()->unique()->numerify('####'),
            'plate_number' => fake()->numerify('###').' '.fake()->randomElement(['أ ب ج', 'د هـ و', 'س ص ع']),
            'capacity' => fake()->randomElement([20, 30, 45]),
            'model' => fake()->randomElement(['Toyota Coaster', 'Mercedes Sprinter', 'Hyundai County']),
            'year' => fake()->numberBetween(2018, 2024),
            'school_id' => School::factory(),
            'driver_id' => null,
            'assistant_id' => null,
            'field_supervisor_id' => null,
            'route_id' => null,
            'status' => 'active',
            'front_qr' => 'QR_FRONT_'.fake()->unique()->uuid(),
            'back_qr' => 'QR_BACK_'.fake()->unique()->uuid(),
            'color' => 'Yellow',
            'latitude' => 24.7136,
            'longitude' => 46.6753,
            'last_location_update' => now(),
        ];
    }
}
