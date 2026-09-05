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

    public function test_admin_can_create_driver_with_english_only_names_and_without_email(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/drivers', [
            'first_name_en' => 'John',
            'last_name_en' => 'Doe',
            'national_id' => '1029384757',
            'phone' => '+966501234568',
            'license_number' => 'LIC-11223344',
            'license_expiry_date' => now()->addYears(2)->toDateString(),
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'national_id' => '1029384757',
            'first_name_en' => 'John',
            'first_name_ar' => null,
            'email' => null,
        ]);
        $this->assertDatabaseHas('drivers', ['license_number' => 'LIC-11223344']);
    }

    public function test_admin_can_update_driver_without_email(): void
    {
        $admin = $this->createAdmin();

        $driverUser = $this->createDriver([
            'first_name_en' => 'Michael',
            'last_name_en' => 'Smith',
            'first_name_ar' => null,
            'last_name_ar' => null,
            'email' => null,
            'national_id' => '1029384758',
            'phone' => '+966501234569',
        ]);

        $response = $this->actingAs($admin)->put("/admin/drivers/{$driverUser->id}", [
            'first_name_en' => 'Michael Updated',
            'last_name_en' => 'Smith',
            'national_id' => '1029384758',
            'phone' => '+966501234569',
            'license_number' => $driverUser->driver->license_number,
            'license_expiry_date' => now()->addYears(2)->toDateString(),
            'email' => '',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $driverUser->id,
            'first_name_en' => 'Michael Updated',
            'email' => null,
        ]);
    }

    public function test_admin_can_create_assistant_with_english_only_names(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/assistants', [
            'first_name_en' => 'Sarah',
            'last_name_en' => 'Connor',
            'national_id' => '1029384759',
            'phone' => '+966501234570',
            'status' => 'active',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'national_id' => '1029384759',
            'first_name_en' => 'Sarah',
            'first_name_ar' => null,
        ]);
    }

    public function test_admin_can_create_field_supervisor_with_english_only_names(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/field-supervisors', [
            'first_name_en' => 'David',
            'last_name_en' => 'Miller',
            'national_id' => '1029384760',
            'phone' => '+966501234571',
            'status' => 'active',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'national_id' => '1029384760',
            'first_name_en' => 'David',
            'first_name_ar' => null,
        ]);
    }

    public function test_admin_can_create_school_admin_with_english_only_names(): void
    {
        $admin = $this->createAdmin();
        $school = School::factory()->create();

        $response = $this->actingAs($admin)->post('/admin/school-admins', [
            'first_name_en' => 'Emma',
            'last_name_en' => 'Watson',
            'email' => 'emma.admin@school.test',
            'national_id' => '1029384761',
            'phone' => '+966501234572',
            'school_id' => $school->id,
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'status' => 'active',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'national_id' => '1029384761',
            'first_name_en' => 'Emma',
            'first_name_ar' => null,
        ]);
    }
}
