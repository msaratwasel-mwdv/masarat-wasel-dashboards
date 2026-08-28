<?php

namespace Tests\Feature\Auth;

use App\Models\School;
use Tests\TestCase;
use Tests\Traits\CreatesUsers;

class RoleMiddlewareTest extends TestCase
{
    use CreatesUsers;

    public function test_guest_is_redirected_to_login(): void
    {
        $response = $this->get('/admin/dashboard');

        $response->assertRedirect('/login');
    }

    public function test_admin_can_access_admin_dashboard(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/admin/dashboard');

        $response->assertStatus(200);
    }

    public function test_school_admin_cannot_access_admin_dashboard(): void
    {
        $school = School::factory()->create();
        $schoolAdmin = $this->createSchoolAdmin($school);

        $response = $this->actingAs($schoolAdmin)->get('/admin/dashboard');

        $response->assertStatus(403);
    }

    public function test_driver_cannot_access_admin_or_school_dashboard(): void
    {
        $driver = $this->createDriver();

        $responseAdmin = $this->actingAs($driver)->get('/admin/dashboard');
        $responseAdmin->assertStatus(403);

        $responseSchool = $this->actingAs($driver)->get('/school/dashboard');
        $responseSchool->assertStatus(403);
    }

    public function test_school_admin_can_access_school_dashboard(): void
    {
        $school = School::factory()->create();
        $schoolAdmin = $this->createSchoolAdmin($school);

        $response = $this->actingAs($schoolAdmin)->get('/school/dashboard');

        $response->assertStatus(200);
    }
}
