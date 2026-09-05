<?php

namespace Tests\Feature\School;

use App\Models\AbsenceRequest;
use App\Models\Attendance;
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

    public function test_school_admin_can_search_attendance_by_student_national_id_and_name(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);

        $student = Student::factory()->enrolled($school, $classroom)->create([
            'first_name_ar' => 'طارق',
            'national_id' => '1000200030',
        ]);
        $attendance = Attendance::create([
            'student_id' => $student->id,
            'classroom_id' => $classroom->id,
            'date' => now()->toDateString(),
            'status' => 'present',
        ]);

        $response = $this->actingAs($schoolAdmin)->get('/school/attendance?search=1000200030');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('School/Attendance/AttendanceReports')
            ->has('attendance', 1)
            ->where('attendance.0.id', $attendance->id)
            ->where('filters.search', '1000200030')
        );

        $responseByName = $this->actingAs($schoolAdmin)->get('/school/attendance?search=طارق');
        $responseByName->assertStatus(200);
        $responseByName->assertInertia(fn ($page) => $page
            ->component('School/Attendance/AttendanceReports')
            ->has('attendance', 1)
        );
    }

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

    public function test_school_admin_can_view_attendance_with_classroom_teacher(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);

        $this->createTeacher($school, $grade);

        $student = Student::factory()->enrolled($school, $classroom)->create();
        $attendance = Attendance::create([
            'student_id' => $student->id,
            'classroom_id' => $classroom->id,
            'date' => now()->toDateString(),
            'status' => 'present',
        ]);

        $response = $this->actingAs($schoolAdmin)->get('/school/attendance');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('School/Attendance/AttendanceReports')
            ->has('attendance', 1)
            ->where('attendance.0.id', $attendance->id)
            ->has('attendance.0.classroom.teachers', 1)
        );
    }

    public function test_school_admin_can_update_attendance_via_put(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);

        $student = Student::factory()->enrolled($school, $classroom)->create();
        $attendance = Attendance::create([
            'student_id' => $student->id,
            'classroom_id' => $classroom->id,
            'date' => now()->toDateString(),
            'status' => 'present',
        ]);

        $response = $this->actingAs($schoolAdmin)->put("/school/attendance/{$attendance->id}", [
            'status' => 'absent',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('absent', $attendance->fresh()->status);
    }
}
