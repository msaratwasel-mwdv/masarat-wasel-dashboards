<?php

namespace Tests\Feature\School;

use App\Models\Bus;
use App\Models\School;
use App\Models\Student;
use App\Models\Trip;
use App\Models\TripAttendance;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class SchoolLiveTrackingTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    public function test_school_admin_can_view_live_tracking_page(): void
    {
        $school = School::factory()->create([
            'is_active' => true,
            'latitude' => 13.9407,
            'longitude' => 43.7873,
        ]);
        $schoolAdmin = $this->createSchoolAdmin($school);

        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'bus_number' => 'B-100',
            'latitude' => 13.9450,
            'longitude' => 43.7890,
            'status' => 'active',
        ]);

        $response = $this->actingAs($schoolAdmin)->get('/school/live-tracking');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('School/LiveTracking/Index')
            ->has('buses')
            ->has('schoolLocation')
            ->has('stats')
        );
    }

    public function test_tracking_api_returns_buses_with_dual_tone_waypoints_and_attendances(): void
    {
        $school = School::factory()->create([
            'is_active' => true,
            'latitude' => 13.9407,
            'longitude' => 43.7873,
        ]);
        $schoolAdmin = $this->createSchoolAdmin($school);

        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'bus_number' => 'B-100',
            'latitude' => 13.9450,
            'longitude' => 43.7890,
            'status' => 'active',
        ]);

        $trip = Trip::factory()->create([
            'school_id' => $school->id,
            'bus_id' => $bus->id,
            'status' => 'in_progress',
            'type' => 'forth',
            'trip_date' => today(),
        ]);

        $grade = \App\Models\Grade::factory()->create(['school_id' => $school->id]);
        $classroom = \App\Models\Classroom::factory()->create(['grade_id' => $grade->id]);

        $student = Student::factory()->enrolled($school, $classroom)->create([
            'forth_latitude' => 13.9420,
            'forth_longitude' => 43.7850,
        ]);

        TripAttendance::create([
            'trip_id' => $trip->id,
            'student_id' => $student->id,
            'status' => 'boarded',
        ]);

        $response = $this->actingAs($schoolAdmin)->getJson('/school/buses/tracking/api');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'buses' => [
                '*' => [
                    'id',
                    'bus_number',
                    'status',
                    'latitude',
                    'longitude',
                    'active_trip' => [
                        'id',
                        'type',
                        'status',
                        'students',
                        'waypoints',
                    ],
                ],
            ],
            'stats' => [
                'total_buses',
                'active_buses',
                'moving_buses',
                'total_students',
                'students_on_board',
            ],
        ]);

        $data = $response->json();
        $this->assertTrue($data['success']);
        $this->assertCount(1, $data['buses']);
        $this->assertNotNull($data['buses'][0]['active_trip']);
        $this->assertNotEmpty($data['buses'][0]['active_trip']['waypoints']);
        $this->assertNotEmpty($data['buses'][0]['active_trip']['students']);
        $this->assertEquals('boarded', $data['buses'][0]['active_trip']['students'][0]['status']);
    }
}
