<?php

namespace Tests\Feature\Api;

use App\Models\Bus;
use App\Models\Classroom;
use App\Models\Grade;
use App\Models\School;
use App\Models\Student;
use App\Models\Subscription;
use App\Models\Teacher;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesUsers;

class TeacherAndSupervisorApiControllerTest extends TestCase
{
    use CreatesSchoolData, CreatesUsers;

    public function test_teacher_can_fetch_classes_and_mark_attendance(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        Subscription::factory()->create(['school_id' => $school->id, 'status' => 'active']);

        $teacherUser = $this->createTeacher($school);
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);

        $teacherUser->teacher()->update(['grade_id' => $grade->id]);

        $student = Student::factory()->enrolled($school, $classroom)->create();

        Sanctum::actingAs($teacherUser, ['*']);

        // 1. Get Teacher Classes
        $responseClasses = $this->getJson('/api/teacher/classes');
        $responseClasses->assertStatus(200);

        // 2. Get Class Students
        $responseStudents = $this->getJson("/api/teacher/classes/{$classroom->id}/students");
        $responseStudents->assertStatus(200);

        // 3. Mark Attendance
        $responseAttendance = $this->putJson("/api/teacher/students/{$student->id}/attendance", [
            'status' => 'present',
            'classroom_id' => $classroom->id,
            'date' => today()->toDateString(),
        ]);
        $responseAttendance->assertStatus(200);

        $this->assertDatabaseHas('attendances', [
            'student_id' => $student->id,
            'status' => 'present',
        ]);
    }

    public function test_field_supervisor_can_fetch_stats_and_buses(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        Subscription::factory()->create(['school_id' => $school->id, 'status' => 'active']);

        $supervisor = $this->createFieldSupervisor();
        Bus::factory()->create(['school_id' => $school->id]);

        Sanctum::actingAs($supervisor, ['*']);

        $responseStats = $this->getJson('/api/field/dashboard-stats');
        $responseStats->assertStatus(200)
            ->assertJsonPath('success', true);

        $responseBuses = $this->getJson('/api/field/buses');
        $responseBuses->assertStatus(200);
    }
}
