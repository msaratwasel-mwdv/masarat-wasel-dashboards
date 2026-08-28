<?php

namespace Tests\Traits;

use App\Models\Classroom;
use App\Models\Grade;
use App\Models\School;
use App\Models\Student;
use App\Models\User;

trait CreatesSchoolData
{
    /**
     * Create a complete School setup with Grade, Classroom, and School Admin.
     */
    public function createCompleteSchool(array $attributes = []): array
    {
        $school = School::factory()->create($attributes);
        $admin = User::factory()->schoolAdmin($school)->create();
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);

        return [
            'school' => $school,
            'admin' => $admin,
            'grade' => $grade,
            'classroom' => $classroom,
        ];
    }

    /**
     * Create an enrolled Student linked to a School, Grade, and Classroom.
     */
    public function createEnrolledStudent(?School $school = null, ?Classroom $classroom = null, array $studentAttributes = []): Student
    {
        $targetSchool = $school ?? School::factory()->create();
        $targetClassroom = $classroom ?? Classroom::factory()->create([
            'grade_id' => Grade::factory()->create(['school_id' => $targetSchool->id])->id,
        ]);

        return Student::factory()->enrolled($targetSchool, $targetClassroom)->create($studentAttributes);
    }
}
