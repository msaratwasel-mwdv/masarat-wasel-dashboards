<?php

namespace Tests\Unit\Models;

use App\Models\AbsenceRequest;
use App\Models\Attendance;
use App\Models\Bus;
use App\Models\Classroom;
use App\Models\Delay;
use App\Models\School;
use App\Models\Student;
use App\Models\Trip;
use App\Models\TripAttendance;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class TripAndAttendanceModelTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    public function test_trip_relationships(): void
    {
        $school = School::factory()->create();
        $bus = Bus::factory()->create(['school_id' => $school->id]);
        $driver = $this->createDriver();

        $trip = Trip::factory()->create([
            'bus_id' => $bus->id,
            'school_id' => $school->id,
            'driver_id' => $driver->id,
        ]);

        $student = Student::factory()->create();
        $tripAttendance = TripAttendance::factory()->create([
            'trip_id' => $trip->id,
            'student_id' => $student->id,
        ]);

        $this->assertEquals($bus->id, $trip->bus->id);
        $this->assertEquals($school->id, $trip->school->id);
        $this->assertEquals($driver->id, $trip->driver->id);
        $this->assertTrue($trip->attendances->contains('id', $tripAttendance->id));
        $this->assertTrue($trip->students->contains('id', $student->id));
    }

    public function test_trip_attendance_relationships(): void
    {
        $trip = Trip::factory()->create();
        $student = Student::factory()->create();

        $attendance = TripAttendance::factory()->create([
            'trip_id' => $trip->id,
            'student_id' => $student->id,
            'status' => 'boarded',
            'check_in_time' => now(),
        ]);

        $this->assertEquals($trip->id, $attendance->trip->id);
        $this->assertEquals($student->id, $attendance->student->id);
        $this->assertEquals('boarded', $attendance->status);
    }

    public function test_daily_attendance_relationships(): void
    {
        $student = Student::factory()->create();
        $classroom = Classroom::factory()->create();
        $teacher = $this->createTeacher();

        $attendance = Attendance::factory()->create([
            'student_id' => $student->id,
            'classroom_id' => $classroom->id,
            'recorded_by' => $teacher->id,
            'status' => 'present',
        ]);

        $this->assertEquals($student->id, $attendance->student->id);
        $this->assertEquals($classroom->id, $attendance->classroom->id);
    }

    public function test_absence_request_relationships(): void
    {
        $student = Student::factory()->create();
        $guardian = $this->createGuardian();
        $processor = $this->createSchoolAdmin();

        $absence = AbsenceRequest::factory()->create([
            'student_id' => $student->id,
            'guardian_id' => $guardian->id,
            'processed_by' => $processor->id,
            'status' => 'approved',
        ]);

        $this->assertEquals($student->id, $absence->student->id);
        $this->assertEquals($guardian->id, $absence->guardian->id);
        $this->assertEquals($processor->id, $absence->processor->id);
    }

    public function test_delay_model_relationships(): void
    {
        $bus = Bus::factory()->create();
        $student = Student::factory()->create();
        $driver = $this->createDriver();

        $delay = Delay::create([
            'type' => 'bus',
            'bus_id' => $bus->id,
            'student_id' => $student->id,
            'duration_minutes' => 15,
            'reason' => 'ازدحام مروري عند الإشارة',
            'reporter_id' => $driver->id,
        ]);

        $this->assertEquals($bus->id, $delay->bus->id);
        $this->assertEquals($student->id, $delay->student->id);
        $this->assertEquals($driver->id, $delay->reporter->id);
    }
}
