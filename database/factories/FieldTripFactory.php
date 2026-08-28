<?php

namespace Database\Factories;

use App\Models\Bus;
use App\Models\FieldTrip;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\FieldTrip>
 */
class FieldTripFactory extends Factory
{
    protected $model = FieldTrip::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'bus_id' => Bus::factory(),
            'name' => 'رحلة علمية إلى '.fake('ar_SA')->city(),
            'description' => 'زيارة تعليمية استكشافية للطلاب',
            'date' => now()->addDays(5)->toDateString(),
            'departure_time' => '08:00',
            'arrival_time' => now()->addDays(5)->setTime(13, 0),
            'destination_address' => 'مركز الملك عبد العزيز التاريخي',
            'destination_latitude' => 24.6475,
            'destination_longitude' => 46.7111,
            'cost' => 500.00,
            'status' => 'pending',
            'rejection_reason' => null,
        ];
    }
}
