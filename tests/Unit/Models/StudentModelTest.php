<?php

namespace Tests\Unit\Models;

use App\Models\Bus;
use App\Models\Classroom;
use App\Models\Grade;
use App\Models\School;
use App\Models\Student;
use App\Models\Trip;
use App\Models\TripAttendance;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesUsers;

class StudentModelTest extends TestCase
{
    use CreatesSchoolData, CreatesUsers;

    public function test_student_full_name_attribute(): void
    {
        $student = Student::factory()->create([
            'first_name_ar' => 'سارة',
            'last_name_ar' => 'القحطاني',
            'first_name_en' => 'Sarah',
            'last_name_en' => 'Alqahtani',
        ]);

        app()->setLocale('ar');
        $this->assertEquals('سارة القحطاني', $student->full_name);

        app()->setLocale('en');
        $this->assertEquals('Sarah Alqahtani', $student->full_name);
    }

    public function test_student_enrollment_and_school_id_resolution(): void
    {
        $school = School::factory()->create();
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);

        $student = Student::factory()->enrolled($school, $classroom)->create();

        $this->assertNotNull($student->currentEnrollment);
        $this->assertEquals($classroom->id, $student->currentEnrollment->classroom_id);
        $this->assertEquals($school->id, $student->school_id);
    }

    public function test_student_buses_relationships(): void
    {
        $forthBus = Bus::factory()->create();
        $backBus = Bus::factory()->create();

        $student = Student::factory()->create([
            'forth_bus_id' => $forthBus->id,
            'back_bus_id' => $backBus->id,
        ]);

        $this->assertEquals($forthBus->id, $student->forthBus->id);
        $this->assertEquals($backBus->id, $student->backBus->id);
    }

    public function test_student_guardian_relationship(): void
    {
        $student = Student::factory()->create();
        $guardian = $this->createGuardian();

        $student->guardians()->attach($guardian->id, ['relationship_type' => 'mother']);

        $this->assertTrue($student->guardians->contains('id', $guardian->id));
        $this->assertEquals('mother', $student->guardians->first()->pivot->relationship_type);
    }

    public function test_student_trip_attendance_and_last_attendance(): void
    {
        $student = Student::factory()->create();
        $trip = Trip::factory()->create(['trip_date' => today()->toDateString()]);

        $attendance = TripAttendance::factory()->create([
            'trip_id' => $trip->id,
            'student_id' => $student->id,
            'status' => 'boarded',
        ]);

        $this->assertTrue($student->tripAttendances->contains('id', $attendance->id));
        $this->assertNotNull($student->lastTripAttendance);
        $this->assertEquals($attendance->id, $student->lastTripAttendance->id);
    }

    public function test_student_soft_delete_clears_assigned_buses(): void
    {
        $forthBus = Bus::factory()->create();
        $backBus = Bus::factory()->create();

        $student = Student::factory()->create([
            'forth_bus_id' => $forthBus->id,
            'back_bus_id' => $backBus->id,
        ]);

        $student->delete();

        $this->assertSoftDeleted('students', ['id' => $student->id]);

        $deletedRecord = Student::withTrashed()->find($student->id);
        $this->assertNull($deletedRecord->forth_bus_id);
        $this->assertNull($deletedRecord->back_bus_id);
    }

    public function test_scope_in_school(): void
    {
        $school1 = School::factory()->create();
        $grade1 = Grade::factory()->create(['school_id' => $school1->id]);
        $classroom1 = Classroom::factory()->create(['grade_id' => $grade1->id]);

        $school2 = School::factory()->create();
        $grade2 = Grade::factory()->create(['school_id' => $school2->id]);
        $classroom2 = Classroom::factory()->create(['grade_id' => $grade2->id]);

        $student1 = Student::factory()->enrolled($school1, $classroom1)->create();
        $student2 = Student::factory()->enrolled($school2, $classroom2)->create();

        $school1Students = Student::inSchool($school1->id)->get();

        $this->assertTrue($school1Students->contains('id', $student1->id));
        $this->assertFalse($school1Students->contains('id', $student2->id));
    }
}
