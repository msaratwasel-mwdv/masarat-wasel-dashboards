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
}
