<?php

namespace Database\Factories;

use App\Models\Bus;
use App\Models\BusRequest;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BusRequest>
 */
class BusRequestFactory extends Factory
{
    protected $model = BusRequest::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'request_type' => fake()->randomElement(['permanent', 'temporary', 'field_trip']),
            'bus_id' => null,
            'seats' => 30,
            'cost' => 1500.00,
            'start_date' => now()->addDays(2)->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
            'destination_address' => 'الرياض',
            'destination_location' => null,
            'purpose' => 'زيادة أعداد الطلاب في الحي',
            'details' => 'طلب توفير حافلة إضافية للمسار الجديد',
            'status' => 'pending',
            'rejection_reason' => null,
            'approved_at' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => 'approved',
            'approved_at' => now(),
            'bus_id' => Bus::factory(),
        ]);
    }
}
