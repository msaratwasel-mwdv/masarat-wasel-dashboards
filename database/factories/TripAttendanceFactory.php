<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\Trip;
use App\Models\TripAttendance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TripAttendance>
 */
class TripAttendanceFactory extends Factory
{
    protected $model = TripAttendance::class;

    public function definition(): array
    {
        return [
            'trip_id' => Trip::factory(),
            'student_id' => Student::factory(),
            'check_in_time' => null,
            'check_out_time' => null,
            'status' => 'pending',
            'waiting_start_time' => null,
            'extra_wait_time' => 0,
        ];
    }

    public function boarded(): static
    {
        return $this->state(fn () => [
            'status' => 'boarded',
            'check_in_time' => now(),
        ]);
    }

    public function dropped(): static
    {
        return $this->state(fn () => [
            'status' => 'dropped',
            'check_in_time' => now()->subMinutes(30),
            'check_out_time' => now(),
        ]);
    }
}
