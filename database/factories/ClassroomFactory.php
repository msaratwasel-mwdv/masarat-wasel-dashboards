<?php

namespace Database\Factories;

use App\Models\Classroom;
use App\Models\Grade;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Classroom>
 */
class ClassroomFactory extends Factory
{
    protected $model = Classroom::class;

    public function definition(): array
    {
        return [
            'name' => 'فصل '.fake()->randomElement(['1/أ', '1/ب', '2/أ', '2/ب', '3/أ']),
            'name_en' => 'Class '.fake()->randomElement(['1-A', '1-B', '2-A', '2-B']),
            'grade_id' => Grade::factory(),
        ];
    }
}
