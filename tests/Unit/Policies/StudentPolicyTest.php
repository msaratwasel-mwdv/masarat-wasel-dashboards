<?php

namespace Tests\Unit\Policies;

use App\Models\Classroom;
use App\Models\Grade;
use App\Models\School;
use App\Models\Student;
use App\Policies\StudentPolicy;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesUsers;

class StudentPolicyTest extends TestCase
{
    use CreatesSchoolData, CreatesUsers;

    protected StudentPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new StudentPolicy;
    }

    public function test_school_admin_can_manage_student_belonging_to_same_school(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);

        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);
        $student = Student::factory()->enrolled($school, $classroom)->create();

        $this->assertTrue($this->policy->view($schoolAdmin, $student));
        $this->assertTrue($this->policy->update($schoolAdmin, $student));
        $this->assertTrue($this->policy->delete($schoolAdmin, $student));
    }

    public function test_school_admin_cannot_manage_student_from_another_school(): void
    {
        $schoolA = School::factory()->create(['is_active' => true]);
        $schoolB = School::factory()->create(['is_active' => true]);

        $adminSchoolA = $this->createSchoolAdmin($schoolA);

        $gradeB = Grade::factory()->create(['school_id' => $schoolB->id]);
        $classroomB = Classroom::factory()->create(['grade_id' => $gradeB->id]);
        $studentOfSchoolB = Student::factory()->enrolled($schoolB, $classroomB)->create();

        $this->assertFalse($this->policy->view($adminSchoolA, $studentOfSchoolB));
        $this->assertFalse($this->policy->update($adminSchoolA, $studentOfSchoolB));
        $this->assertFalse($this->policy->delete($adminSchoolA, $studentOfSchoolB));
    }

    public function test_user_without_school_cannot_manage_student(): void
    {
        $userWithoutSchool = $this->createDriver();
        $school = School::factory()->create();
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);
        $student = Student::factory()->enrolled($school, $classroom)->create();

        $this->assertFalse($this->policy->view($userWithoutSchool, $student));
        $this->assertFalse($this->policy->update($userWithoutSchool, $student));
    }
}
