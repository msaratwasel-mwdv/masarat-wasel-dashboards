<?php

namespace Tests\Feature\Observers;

use App\Models\Bus;
use App\Models\School;
use App\Models\Student;
use App\Models\Trip;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class ModelObserversTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    public function test_trip_observer_logs_status_transitions(): void
    {
        $school = School::factory()->create();
        $driver = $this->createDriver();
        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
        ]);

        $trip = Trip::factory()->create([
            'school_id' => $school->id,
            'bus_id' => $bus->id,
            'driver_id' => $driver->id,
            'status' => 'pending',
        ]);

        $trip->update(['status' => 'in_progress']);

        $this->assertDatabaseHas('system_event_logs', [
            'entity_type' => 'Trip',
            'entity_id' => $trip->id,
            'event_type' => 'trip_state_transition',
        ]);
    }

    public function test_student_observer_initializes_properly(): void
    {
        $school = School::factory()->create();
        $student = Student::factory()->create([
            'is_active' => true,
        ]);

        $this->assertNotNull($student->student_code);
        $this->assertTrue((bool) $student->is_active);
    }
}
