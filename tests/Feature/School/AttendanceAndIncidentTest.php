<?php

namespace Tests\Feature\School;

use App\Models\AbsenceRequest;
use App\Models\Classroom;
use App\Models\Grade;
use App\Models\School;
use App\Models\Student;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesUsers;

class AttendanceAndIncidentTest extends TestCase
{
    use CreatesSchoolData, CreatesUsers;

    public function test_school_admin_can_view_and_process_absence_requests(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);

        $student = Student::factory()->enrolled($school, $classroom)->create();
        $guardian = $this->createGuardian();
        $student->guardians()->attach($guardian->id, ['relationship_type' => 'father']);

        $absence = AbsenceRequest::factory()->create([
            'student_id' => $student->id,
            'guardian_id' => $guardian->id,
            'status' => 'pending',
        ]);

        $responseIndex = $this->actingAs($schoolAdmin)->get('/school/absence-requests');
        $responseIndex->assertStatus(200);

        $responseProcess = $this->actingAs($schoolAdmin)->post("/school/absence-requests/{$absence->id}/process", [
            'status' => 'approved',
        ]);

        $responseProcess->assertRedirect();
        $absence->refresh();
        $this->assertEquals('approved', $absence->status);
        $this->assertEquals($schoolAdmin->id, $absence->processed_by);
    }
}
