<?php

namespace Database\Factories;

use App\Models\Bus;
use App\Models\BusExpense;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BusExpense>
 */
class BusExpenseFactory extends Factory
{
    protected $model = BusExpense::class;

    public function definition(): array
    {
        return [
            'bus_id' => Bus::factory(),
            'type' => fake()->randomElement(['fuel', 'maintenance', 'oil', 'tires', 'other']),
            'amount' => fake()->randomFloat(2, 50, 1000),
            'date' => now()->toDateString(),
            'extra_info' => 'مصاريف صيانة الدورية',
            'receipt_photo' => null,
        ];
    }
}
