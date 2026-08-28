<?php

namespace Database\Factories;

use App\Models\Route;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Route>
 */
class RouteFactory extends Factory
{
    protected $model = Route::class;

    public function definition(): array
    {
        return [
            'name' => 'مسار '.fake('ar_SA')->city(),
            'code' => 'RT-'.fake()->unique()->numerify('###'),
            'description' => 'وصف مسار النقل المدرسي',
            'school_id' => School::factory(),
            'estimated_distance_km' => fake()->randomFloat(2, 5, 30),
        ];
    }
}
