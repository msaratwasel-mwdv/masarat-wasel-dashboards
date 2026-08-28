<?php

namespace Database\Factories;

use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Attendance>
 */
class AttendanceFactory extends Factory
{
    protected $model = Attendance::class;

    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'classroom_id' => Classroom::factory(),
            'date' => now()->toDateString(),
            'status' => 'present',
            'recorded_by' => null,
            'is_notified' => false,
        ];
    }
}
