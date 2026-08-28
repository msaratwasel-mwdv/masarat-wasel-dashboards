<?php

namespace Tests\Unit\Models;

use App\Models\Bus;
use App\Models\BusExpense;
use App\Models\Route;
use App\Models\School;
use App\Models\Trip;
use Tests\TestCase;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class BusModelTest extends TestCase
{
    use CreatesTransportData, CreatesUsers;

    public function test_bus_relations_with_school_driver_and_assistant(): void
    {
        $school = School::factory()->create();
        $driverUser = $this->createDriver();
        $assistantUser = $this->createAssistant();
        $supervisorUser = $this->createFieldSupervisor();
        $route = Route::factory()->create(['school_id' => $school->id]);

        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driverUser->id,
            'assistant_id' => $assistantUser->id,
            'field_supervisor_id' => $supervisorUser->id,
            'route_id' => $route->id,
        ]);

        $this->assertEquals($school->id, $bus->school->id);
        $this->assertEquals($driverUser->id, $bus->driver->user_id);
        $this->assertEquals($assistantUser->id, $bus->assistant->id);
        $this->assertEquals($supervisorUser->id, $bus->fieldSupervisor->id);
        $this->assertEquals($route->id, $bus->route->id);
    }

    public function test_bus_expenses_relationship(): void
    {
        $bus = Bus::factory()->create();
        $expense = BusExpense::factory()->create([
            'bus_id' => $bus->id,
            'amount' => 250.00,
            'type' => 'fuel',
        ]);

        $this->assertTrue($bus->expenses()->get()->contains('id', $expense->id));
    }

    public function test_bus_trip_status_attribute(): void
    {
        $bus = Bus::factory()->create();

        // When no trips exist, status should be idle
        $this->assertEquals('idle', $bus->trip_status);

        // When a pending forth trip exists
        $trip = Trip::factory()->create([
            'bus_id' => $bus->id,
            'type' => 'forth',
            'status' => 'pending',
        ]);

        $bus->unsetRelation('activeTrip');
        $this->assertEquals('pending_to_school', $bus->trip_status);

        // When in progress
        $trip->update(['status' => 'in_progress']);
        $bus->unsetRelation('activeTrip');
        $this->assertEquals('to_school', $bus->trip_status);
    }

    public function test_bus_target_coordinates_fallback_to_school(): void
    {
        $school = School::factory()->create([
            'latitude' => 24.7136,
            'longitude' => 46.6753,
        ]);

        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'target_latitude' => null,
            'target_longitude' => null,
        ]);

        $trip = Trip::factory()->create([
            'bus_id' => $bus->id,
            'school_id' => $school->id,
            'type' => 'forth',
            'status' => 'in_progress',
        ]);

        // When no remaining students, target falls back to school coordinates
        $this->assertEquals(24.7136, $bus->target_latitude);
        $this->assertEquals(46.6753, $bus->target_longitude);
    }
}
