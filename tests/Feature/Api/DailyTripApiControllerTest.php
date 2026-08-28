<?php

namespace Tests\Feature\Api;

use App\Models\Bus;
use App\Models\School;
use App\Models\Student;
use App\Models\Subscription;
use App\Models\Trip;
use App\Models\TripAttendance;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class DailyTripApiControllerTest extends TestCase
{
    use CreatesTransportData, CreatesUsers;

    public function test_driver_can_fetch_my_trips(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        Subscription::factory()->create(['school_id' => $school->id, 'status' => 'active']);

        $driver = $this->createDriver();
        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
        ]);

        $trip = Trip::factory()->create([
            'school_id' => $school->id,
            'bus_id' => $bus->id,
            'driver_id' => $driver->id,
            'trip_date' => today()->toDateString(),
            'status' => 'pending',
        ]);

        Sanctum::actingAs($driver, ['*']);

        $response = $this->getJson('/api/driver/my-trips');
        $response->assertStatus(200);
    }

    public function test_driver_can_start_and_end_trip(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        Subscription::factory()->create(['school_id' => $school->id, 'status' => 'active']);

        $driver = $this->createDriver();
        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
        ]);

        $trip = Trip::factory()->create([
            'school_id' => $school->id,
            'bus_id' => $bus->id,
            'driver_id' => $driver->id,
            'trip_date' => today()->toDateString(),
            'status' => 'pending',
            'type' => 'forth',
        ]);

        Sanctum::actingAs($driver, ['*']);

        // 1. Driver starts trip -> awaiting_confirmation
        $responseStart = $this->postJson("/api/bus/{$bus->id}/start-trip", [
            'latitude' => 24.7136,
            'longitude' => 46.6753,
        ]);
        $responseStart->assertSuccessful();

        $trip->refresh();
        $this->assertEquals('awaiting_confirmation', $trip->status);

        // 2. Assistant/Driver confirms trip -> in_progress
        $responseConfirm = $this->postJson("/api/bus/{$bus->id}/confirm-trip", [
            'trip_id' => $trip->id,
        ]);
        $responseConfirm->assertSuccessful();

        $trip->refresh();
        $this->assertEquals('in_progress', $trip->status);

        // 3. Arrive / Finish Trip -> awaiting_video
        $responseArrive = $this->postJson("/api/bus/{$bus->id}/arrive");
        $responseArrive->assertSuccessful();

        $trip->refresh();
        $this->assertEquals('awaiting_video', $trip->status);
    }

    public function test_driver_can_mark_student_boarded_and_dropped(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        Subscription::factory()->create(['school_id' => $school->id, 'status' => 'active']);

        $driver = $this->createDriver();
        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
        ]);

        $student = Student::factory()->create([
            'forth_bus_id' => $bus->id,
            'is_active' => true,
        ]);

        $trip = Trip::factory()->create([
            'school_id' => $school->id,
            'bus_id' => $bus->id,
            'driver_id' => $driver->id,
            'trip_date' => today()->toDateString(),
            'status' => 'in_progress',
            'type' => 'forth',
        ]);

        $attendance = TripAttendance::factory()->create([
            'trip_id' => $trip->id,
            'student_id' => $student->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($driver, ['*']);

        // Mark Boarded
        $responseBoard = $this->postJson("/api/bus/{$bus->id}/mark-boarded", [
            'trip_id' => $trip->id,
            'student_id' => $student->id,
        ]);
        $responseBoard->assertSuccessful();

        $attendance->refresh();
        $this->assertEquals('boarded', $attendance->status);

        // Mark Dropped
        $responseDrop = $this->postJson("/api/bus/{$bus->id}/mark-dropped", [
            'trip_id' => $trip->id,
            'student_id' => $student->id,
        ]);
        $responseDrop->assertSuccessful();

        $attendance->refresh();
        $this->assertEquals('dropped', $attendance->status);
    }
}
