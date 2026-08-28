<?php

namespace Database\Factories;

use App\Models\AbsenceRequest;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AbsenceRequest>
 */
class AbsenceRequestFactory extends Factory
{
    protected $model = AbsenceRequest::class;

    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'guardian_id' => User::factory()->guardian(),
            'date' => now()->addDay()->toDateString(),
            'type' => 'full_day',
            'reason' => 'ظرف عائلي طارئ',
            'status' => 'pending',
            'processed_by' => null,
            'rejection_reason' => null,
        ];
    }
}
