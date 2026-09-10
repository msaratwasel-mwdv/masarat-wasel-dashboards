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

    public function test_students_ordered_by_stop_order(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        Subscription::factory()->create(['school_id' => $school->id, 'status' => 'active']);

        $driver = $this->createDriver();
        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
        ]);

        $student1 = Student::factory()->create([
            'forth_bus_id' => $bus->id,
            'forth_stop_order' => 2,
            'is_active' => true,
        ]);
        $student2 = Student::factory()->create([
            'forth_bus_id' => $bus->id,
            'forth_stop_order' => 1,
            'is_active' => true,
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

        $response = $this->getJson("/api/bus/{$bus->id}/passengers?trip_type=morning");
        $response->assertSuccessful();

        $passengers = $response->json('passengers');
        $this->assertNotEmpty($passengers);

        // Verify student2 (stop order 1) comes before student1 (stop order 2)
        $this->assertEquals((string) $student2->id, (string) $passengers[0]['id']);
        $this->assertEquals((string) $student1->id, (string) $passengers[1]['id']);
        $this->assertEquals(1, $passengers[0]['stop_order']);
        $this->assertEquals(2, $passengers[1]['stop_order']);
    }

    public function test_check_trip_readiness_seals_arrival_time_before_video_upload(): void
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
            'arrival_time' => null,
        ]);

        TripAttendance::factory()->create([
            'trip_id' => $trip->id,
            'student_id' => $student->id,
            'status' => 'dropped',
        ]);

        Sanctum::actingAs($driver, ['*']);

        $response = $this->getJson("/api/bus/{$bus->id}/check-trip-readiness");
        $response->assertSuccessful();
        $response->assertJson(['can_end' => true]);

        $trip->refresh();
        // Verify arrival_time is recorded now BEFORE video upload
        $this->assertNotNull($trip->arrival_time);
    }

    public function test_wait_time_accurately_records_extra_wait_time_over_two_minutes(): void
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

        // Student arrived and waited 200 seconds (over 120s limit)
        $waitingStart = now()->subSeconds(200);
        $attendance = TripAttendance::factory()->create([
            'trip_id' => $trip->id,
            'student_id' => $student->id,
            'status' => 'waiting',
            'waiting_start_time' => $waitingStart,
            'extra_wait_time' => 0,
        ]);

        Sanctum::actingAs($driver, ['*']);

        $response = $this->postJson("/api/bus/{$bus->id}/mark-boarded", [
            'trip_id' => $trip->id,
            'student_id' => $student->id,
        ]);
        $response->assertSuccessful();

        $attendance->refresh();
        $this->assertEquals('boarded', $attendance->status);
        // 200 seconds total - 120 seconds free = ~80 seconds extra wait
        $this->assertGreaterThanOrEqual(79, $attendance->extra_wait_time);
        $this->assertLessThanOrEqual(82, $attendance->extra_wait_time);
    }
}
