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

    public function test_students_automatically_ordered_by_nearest_neighbor_spatial_distance(): void
    {
        $school = School::factory()->create([
            'is_active' => true,
            'latitude' => 23.5859,
            'longitude' => 58.4059,
        ]);
        Subscription::factory()->create(['school_id' => $school->id, 'status' => 'active']);

        $driver = $this->createDriver();
        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
        ]);

        // Student Far has smaller DB ID (created first)
        $studentFar = Student::factory()->create([
            'forth_bus_id' => $bus->id,
            'back_bus_id' => $bus->id,
            'latitude' => 23.7500,
            'longitude' => 58.6000,
            'forth_stop_order' => 0,
            'back_stop_order' => 0,
            'is_active' => true,
        ]);

        // Student Near has higher DB ID (created second)
        $studentNear = Student::factory()->create([
            'forth_bus_id' => $bus->id,
            'back_bus_id' => $bus->id,
            'latitude' => 23.5900,
            'longitude' => 58.4100,
            'forth_stop_order' => 0,
            'back_stop_order' => 0,
            'is_active' => true,
        ]);

        Sanctum::actingAs($driver, ['*']);

        // 1. Afternoon Trip (School -> Closest Student First)
        $responseAfternoon = $this->getJson("/api/bus/{$bus->id}/passengers?trip_type=afternoon");
        $responseAfternoon->assertSuccessful();
        $passengersAfternoon = $responseAfternoon->json('passengers');

        // Near student must come FIRST regardless of smaller DB ID
        $this->assertEquals((string) $studentNear->id, (string) $passengersAfternoon[0]['id']);
        $this->assertEquals((string) $studentFar->id, (string) $passengersAfternoon[1]['id']);
        $this->assertEquals(1, $passengersAfternoon[0]['stop_order']);
        $this->assertEquals(2, $passengersAfternoon[1]['stop_order']);

        // 2. Morning Trip: when Bus is near Student Far, Student Far is closest to bus and picked up first
        $bus->update([
            'latitude' => 23.7490,
            'longitude' => 58.5990,
        ]);
        $responseMorningFar = $this->getJson("/api/bus/{$bus->id}/passengers?trip_type=morning");
        $responseMorningFar->assertSuccessful();
        $passengersMorningFar = $responseMorningFar->json('passengers');

        $this->assertEquals((string) $studentFar->id, (string) $passengersMorningFar[0]['id']);
        $this->assertEquals((string) $studentNear->id, (string) $passengersMorningFar[1]['id']);
        $this->assertEquals(1, $passengersMorningFar[0]['stop_order']);
        $this->assertEquals(2, $passengersMorningFar[1]['stop_order']);

        // 3. Morning Trip: when Bus is near Student Near, Student Near is closest to bus and picked up first
        $bus->update([
            'latitude' => 23.5890,
            'longitude' => 58.4090,
        ]);
        $responseMorningNear = $this->getJson("/api/bus/{$bus->id}/passengers?trip_type=morning");
        $responseMorningNear->assertSuccessful();
        $passengersMorningNear = $responseMorningNear->json('passengers');

        $this->assertEquals((string) $studentNear->id, (string) $passengersMorningNear[0]['id']);
        $this->assertEquals((string) $studentFar->id, (string) $passengersMorningNear[1]['id']);
        $this->assertEquals(1, $passengersMorningNear[0]['stop_order']);
        $this->assertEquals(2, $passengersMorningNear[1]['stop_order']);
    }

    public function test_bus_targets_closest_student_omar_and_trip_ends_with_video_successfully(): void
    {
        $school = School::factory()->create(['is_active' => true, 'latitude' => 23.5859, 'longitude' => 58.4059]);
        Subscription::factory()->create(['school_id' => $school->id, 'status' => 'active']);

        $driver = $this->createDriver();
        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
            'latitude' => 23.6000,
            'longitude' => 58.4200,
            'target_latitude' => null,
            'target_longitude' => null,
        ]);

        // Student with smaller DB ID but far away (15 km away)
        $studentFar = Student::factory()->create([
            'forth_bus_id' => $bus->id,
            'forth_latitude' => 23.7500,
            'forth_longitude' => 58.6000,
            'latitude' => 23.7500,
            'longitude' => 58.6000,
            'is_active' => true,
        ]);

        // Student Omar with LARGER DB ID but physically CLOSEST to bus (50 meters away)
        $studentOmar = Student::factory()->create([
            'first_name_ar' => 'عمر',
            'last_name_ar' => 'الأحمد',
            'forth_bus_id' => $bus->id,
            'forth_latitude' => 23.6005,
            'forth_longitude' => 58.4205,
            'latitude' => 23.6005,
            'longitude' => 58.4205,
            'is_active' => true,
        ]);

        $this->assertGreaterThan($studentFar->id, $studentOmar->id);

        $trip = Trip::factory()->create([
            'school_id' => $school->id,
            'bus_id' => $bus->id,
            'driver_id' => $driver->id,
            'trip_date' => today()->toDateString(),
            'status' => 'in_progress',
            'type' => 'forth',
        ]);

        TripAttendance::factory()->create(['trip_id' => $trip->id, 'student_id' => $studentFar->id, 'status' => 'pending']);
        TripAttendance::factory()->create(['trip_id' => $trip->id, 'student_id' => $studentOmar->id, 'status' => 'pending']);

        // Bus target coordinates must pick student Omar because he is closest to bus
        $nextStudent = $bus->getNextStudent($trip);
        $this->assertNotNull($nextStudent);
        $this->assertEquals($studentOmar->id, $nextStudent->id);
        $this->assertEquals((float) $studentOmar->latitude, (float) $bus->target_latitude);
        $this->assertEquals((float) $studentOmar->longitude, (float) $bus->target_longitude);

        // Mark all students dropped before ending trip
        TripAttendance::where('trip_id', $trip->id)->update(['status' => 'dropped']);

        // Test endTrip with video upload and distance (verifies DB::transaction use ($request) fix)
        \Illuminate\Support\Facades\Storage::fake('public');
        Sanctum::actingAs($driver, ['*']);

        $video = \Illuminate\Http\UploadedFile::fake()->create('trip_video.mp4', 500, 'video/mp4');

        $response = $this->postJson("/api/bus/{$bus->id}/end-trip", [
            'video' => $video,
            'start_qr_scanned' => true,
            'end_qr_scanned' => true,
            'start_qr_data' => 'FRONT-'.$bus->id,
            'end_qr_data' => 'BACK-'.$bus->id,
            'actual_distance_km' => 12.5,
        ]);

        $response->assertSuccessful();
        $response->assertJson(['trip_status' => 'idle']);

        $trip->refresh();
        $this->assertEquals('finished', $trip->status);
        $this->assertEquals(12.5, (float) $trip->actual_distance_km);
        $this->assertNotNull($trip->video_path);
    }
}
