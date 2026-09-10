<?php

namespace Tests\Feature\School;

use App\Models\Bus;
use App\Models\Classroom;
use App\Models\Grade;
use App\Models\School;
use App\Models\Student;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class SchoolOperationsTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    public function test_school_admin_can_view_buses_index(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);

        Bus::factory()->create([
            'school_id' => $school->id,
            'bus_number' => 'BUS-2026-01',
        ]);

        $response = $this->actingAs($schoolAdmin)->get('/school/buses');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('School/Buses/BusesManagement')
            ->has('buses', 1)
        );
    }

    public function test_school_admin_can_view_and_create_routes(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);

        $response = $this->actingAs($schoolAdmin)->get('/school/routes');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('School/Routes/Index')
            ->has('routes')
        );

        $createResponse = $this->actingAs($schoolAdmin)->post('/school/routes', [
            'name' => 'مسار الدائري الغربي',
            'code' => 'ROUTE-WEST-01',
            'description' => 'يمر عبر الحي الدبلوماسي والميدان',
        ]);

        $createResponse->assertRedirect();
        $this->assertDatabaseHas('routes', [
            'school_id' => $school->id,
            'name' => 'مسار الدائري الغربي',
            'code' => 'ROUTE-WEST-01',
        ]);
    }

    public function test_school_admin_can_view_drivers_index(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $driverUser = $this->createDriver();

        Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driverUser->id,
        ]);

        $response = $this->actingAs($schoolAdmin)->get('/school/drivers');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('School/Drivers/Index')
            ->has('drivers')
        );
    }

    public function test_school_admin_can_view_parents_index(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);

        $response = $this->actingAs($schoolAdmin)->get('/school/parents');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('School/Guardians/Index')
            ->has('guardians')
        );
    }

    public function test_school_admin_can_view_and_record_attendance(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);
        $student = Student::factory()->enrolled($school, $classroom)->create();

        $response = $this->actingAs($schoolAdmin)->get('/school/attendance');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('School/Attendance/AttendanceReports')
        );

        $storeResponse = $this->actingAs($schoolAdmin)->post('/school/attendance', [
            'student_id' => $student->id,
            'classroom_id' => $classroom->id,
            'date' => now()->toDateString(),
            'status' => 'present',
        ]);

        $storeResponse->assertRedirect();
        $this->assertDatabaseHas('attendances', [
            'student_id' => $student->id,
            'classroom_id' => $classroom->id,
            'status' => 'present',
        ]);
    }

    public function test_school_admin_can_save_bus_stop_order(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);

        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);

        $bus = Bus::factory()->create([
            'school_id' => $school->id,
        ]);

        $student1 = Student::factory()->enrolled($school, $classroom)->create([
            'forth_bus_id' => $bus->id,
            'forth_stop_order' => 0,
        ]);
        $student2 = Student::factory()->enrolled($school, $classroom)->create([
            'forth_bus_id' => $bus->id,
            'forth_stop_order' => 0,
        ]);

        $response = $this->actingAs($schoolAdmin)->postJson(route('school.buses.save-stop-order'), [
            'bus_id' => $bus->id,
            'trip_type' => 'morning',
            'orders' => [
                ['student_id' => $student1->id, 'order' => 1],
                ['student_id' => $student2->id, 'order' => 2],
            ],
        ]);

        $response->assertSuccessful();
        $response->assertJson(['success' => true]);

        $this->assertEquals(1, $student1->fresh()->forth_stop_order);
        $this->assertEquals(2, $student2->fresh()->forth_stop_order);
    }

    public function test_live_tracking_api_returns_optimal_waypoints_and_stops(): void
    {
        $school = School::factory()->create([
            'is_active' => true,
            'latitude' => 23.5859,
            'longitude' => 58.4059,
        ]);
        $schoolAdmin = $this->createSchoolAdmin($school);

        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);

        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'latitude' => 23.5859,
            'longitude' => 58.4059,
        ]);

        $student = Student::factory()->enrolled($school, $classroom)->create([
            'forth_bus_id' => $bus->id,
            'back_bus_id' => $bus->id,
            'latitude' => 23.6000,
            'longitude' => 58.4200,
            'is_active' => true,
        ]);

        $response = $this->actingAs($schoolAdmin)->getJson('/school/buses/tracking/api');

        $response->assertSuccessful();
        $response->assertJson(['success' => true]);

        $buses = $response->json('buses');
        $this->assertNotEmpty($buses);

        $trackingBus = collect($buses)->firstWhere('id', $bus->id);
        $this->assertNotNull($trackingBus);
        $this->assertNotNull($trackingBus['active_trip']);
        $this->assertNotEmpty($trackingBus['active_trip']['students']);
        $this->assertNotEmpty($trackingBus['active_trip']['waypoints']);
    }

    public function test_school_admin_can_optimize_route_with_automatic_fallback(): void
    {
        $school = School::factory()->create([
            'is_active' => true,
            'latitude' => 23.5859,
            'longitude' => 58.4059,
        ]);
        $schoolAdmin = $this->createSchoolAdmin($school);

        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);

        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'latitude' => 23.5880,
            'longitude' => 58.4080,
        ]);

        $student1 = Student::factory()->enrolled($school, $classroom)->create([
            'forth_bus_id' => $bus->id,
            'is_active' => true,
            'latitude' => 23.6000,
            'longitude' => 58.4200,
        ]);

        $student2 = Student::factory()->enrolled($school, $classroom)->create([
            'forth_bus_id' => $bus->id,
            'is_active' => true,
            'latitude' => 23.5900,
            'longitude' => 58.4100,
        ]);

        $response = $this->actingAs($schoolAdmin)->postJson(route('school.buses.optimize-route'), [
            'bus_id' => $bus->id,
            'trip_type' => 'morning',
        ]);

        $response->assertSuccessful();
        $response->assertJson(['success' => true]);
        $this->assertCount(2, $response->json('ordered_students'));
    }
}
