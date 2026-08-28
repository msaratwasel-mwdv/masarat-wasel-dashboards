<?php

namespace Tests\Traits;

use App\Models\Bus;
use App\Models\Route;
use App\Models\School;
use App\Models\Trip;
use App\Models\User;

trait CreatesTransportData
{
    /**
     * Create a complete transport fleet unit (School, Route, Driver, Assistant, Bus).
     */
    public function createTransportFleet(?School $school = null): array
    {
        $targetSchool = $school ?? School::factory()->create();
        $driver = User::factory()->driver()->create();
        $assistant = User::factory()->assistant()->create();
        $fieldSupervisor = User::factory()->fieldSupervisor()->create();

        $route = Route::factory()->create(['school_id' => $targetSchool->id]);

        $bus = Bus::factory()->create([
            'school_id' => $targetSchool->id,
            'driver_id' => $driver->id,
            'assistant_id' => $assistant->id,
            'field_supervisor_id' => $fieldSupervisor->id,
            'route_id' => $route->id,
        ]);

        return [
            'school' => $targetSchool,
            'driver' => $driver,
            'assistant' => $assistant,
            'field_supervisor' => $fieldSupervisor,
            'route' => $route,
            'bus' => $bus,
        ];
    }

    /**
     * Create an active Trip with Bus and Driver.
     */
    public function createActiveTrip(?Bus $bus = null, array $tripAttributes = []): Trip
    {
        $targetBus = $bus ?? Bus::factory()->create();

        return Trip::factory()->inProgress()->create(array_merge([
            'bus_id' => $targetBus->id,
            'school_id' => $targetBus->school_id,
            'driver_id' => $targetBus->driver_id,
            'route_id' => $targetBus->route_id,
        ], $tripAttributes));
    }
}
