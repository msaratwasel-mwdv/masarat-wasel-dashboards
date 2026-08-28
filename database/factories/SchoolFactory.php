<?php

namespace Database\Factories;

use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\School>
 */
class SchoolFactory extends Factory
{
    protected $model = School::class;

    public function definition(): array
    {
        return [
            'name' => fake('ar_SA')->company().' الأهلية',
            'name_en' => fake('en_US')->company().' School',
            'logo' => null,
            'latitude' => 24.7136,
            'longitude' => 46.6753,
            'address' => 'الرياض - المملكة العربية السعودية',
            'city' => 'الرياض',
            'status' => 'Active',
            'is_active' => true,
            'contact_email' => fake()->unique()->companyEmail(),
            'contact_phone' => fake()->numerify('+9665########'),
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => [
            'status' => 'Inactive',
            'is_active' => false,
        ]);
    }
}
