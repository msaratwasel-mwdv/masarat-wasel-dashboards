<?php

namespace Database\Factories;

use App\Models\Grade;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Grade>
 */
class GradeFactory extends Factory
{
    protected $model = Grade::class;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع']),
            'school_id' => School::factory(),
        ];
    }
}
