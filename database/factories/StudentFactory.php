<?php

namespace Database\Factories;

use App\Models\Classroom;
use App\Models\School;
use App\Models\Student;
use App\Models\StudentSchoolEnrollment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Student>
 */
class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition(): array
    {
        return [
            'first_name_ar' => fake('ar_SA')->firstName(),
            'last_name_ar' => fake('ar_SA')->lastName(),
            'first_name_en' => fake('en_US')->firstName(),
            'last_name_en' => fake('en_US')->lastName(),
            'student_code' => 'STU-'.fake()->unique()->numerify('######'),
            'national_id' => fake()->unique()->numerify('1#########'),
            'gender' => fake()->randomElement(['male', 'female']),
            'image' => null,
            'is_active' => true,
            'forth_bus_id' => null,
            'forth_latitude' => 24.7136,
            'forth_longitude' => 46.6753,
            'back_bus_id' => null,
            'back_latitude' => 24.7136,
            'back_longitude' => 46.6753,
            'address' => 'حي النرجس، الرياض',
            'latitude' => 24.7136,
            'longitude' => 46.6753,
            'location_note' => 'بجوار المسجد',
        ];
    }

    public function enrolled(?School $school = null, ?Classroom $classroom = null): static
    {
        return $this->afterCreating(function (Student $student) use ($classroom) {
            $targetClassroom = $classroom ?? Classroom::factory()->create();

            StudentSchoolEnrollment::create([
                'student_id' => $student->id,
                'classroom_id' => $targetClassroom->id,
                'is_active' => true,
            ]);
        });
    }
}
