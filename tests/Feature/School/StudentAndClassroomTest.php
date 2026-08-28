<?php

namespace Tests\Feature\School;

use App\Models\Classroom;
use App\Models\Grade;
use App\Models\School;
use App\Models\Student;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesUsers;

class StudentAndClassroomTest extends TestCase
{
    use CreatesSchoolData, CreatesUsers;

    public function test_school_admin_can_access_dashboard_and_classrooms(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);

        $response = $this->actingAs($schoolAdmin)->get('/school/dashboard');
        $response->assertStatus(200);

        $responseClassrooms = $this->actingAs($schoolAdmin)->get('/school/classrooms');
        $responseClassrooms->assertStatus(200);
    }

    public function test_school_admin_can_create_grade_and_classroom(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);

        // 1. Create Grade
        $responseGrade = $this->actingAs($schoolAdmin)->post('/school/classrooms/grades', [
            'name' => 'المرحلة الابتدائية',
        ]);
        $responseGrade->assertRedirect();
        $this->assertDatabaseHas('grades', ['school_id' => $school->id, 'name' => 'المرحلة الابتدائية']);

        $grade = Grade::where('school_id', $school->id)->first();

        // 2. Create Classroom
        $responseClass = $this->actingAs($schoolAdmin)->post('/school/classrooms', [
            'grade_id' => $grade->id,
            'name' => 'فصل 1/أ',
            'gender' => 'boys',
        ]);
        $responseClass->assertRedirect();
        $this->assertDatabaseHas('classrooms', ['grade_id' => $grade->id, 'name' => 'فصل 1/أ']);
    }

    public function test_school_admin_can_view_students_list(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);

        $student = Student::factory()->enrolled($school, $classroom)->create();

        $response = $this->actingAs($schoolAdmin)->get('/school/students');
        $response->assertStatus(200);
    }
}
