<?php

namespace Tests\Feature\Admin;

use App\Models\School;
use Tests\TestCase;
use Tests\Traits\CreatesUsers;

class StaffAndBusManagementTest extends TestCase
{
    use CreatesUsers;

    public function test_admin_can_view_drivers_and_create_driver(): void
    {
        $admin = $this->createAdmin();

        $responseIndex = $this->actingAs($admin)->get('/admin/drivers');
        $responseIndex->assertStatus(200);

        $responseStore = $this->actingAs($admin)->post('/admin/drivers', [
            'first_name_ar' => 'أحمد',
            'last_name_ar' => 'الغامدي',
            'national_id' => '1029384756',
            'phone' => '+966501234567',
            'email' => 'ahmad.driver@masarat.test',
            'license_number' => 'LIC-99887766',
            'license_expiry_date' => now()->addYears(2)->toDateString(),
        ]);

        $responseStore->assertRedirect();
        $this->assertDatabaseHas('users', ['national_id' => '1029384756']);
        $this->assertDatabaseHas('drivers', ['license_number' => 'LIC-99887766']);
    }

    public function test_admin_can_view_buses_and_create_bus(): void
    {
        $admin = $this->createAdmin();
        $school = School::factory()->create();

        $responseIndex = $this->actingAs($admin)->get('/admin/buses');
        $responseIndex->assertStatus(200);

        $responseStore = $this->actingAs($admin)->post('/admin/buses', [
            'school_id' => $school->id,
            'plate_number' => 'أ ب ج 1234',
            'model' => 'Toyota Coaster',
            'year' => 2024,
            'capacity' => 30,
        ]);

        $responseStore->assertRedirect();
        $this->assertDatabaseHas('buses', [
            'school_id' => $school->id,
            'plate_number' => 'أ ب ج 1234',
            'capacity' => 30,
        ]);
    }
}
