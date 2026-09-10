<?php

namespace Tests\Feature\Admin;

use App\Models\Bus;
use App\Models\School;
use Tests\TestCase;
use Tests\Traits\CreatesUsers;

class AdminLiveTrackingTest extends TestCase
{
    use CreatesUsers;

    public function test_admin_can_access_dashboard_with_live_fleet_data(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('liveBuses')
            ->has('liveStats')
            ->has('filterSchools')
            ->has('filterBuses')
        );
    }

    public function test_admin_can_fetch_tracking_api_data(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get(route('admin.buses.tracking.api'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'buses',
            'stats' => [
                'total_buses',
                'active_buses',
                'moving_buses',
                'total_students',
                'students_on_board',
            ],
            'timestamp',
        ]);
    }

    public function test_tracking_api_can_filter_by_school(): void
    {
        $admin = $this->createAdmin();
        $schoolA = School::factory()->create(['name' => 'مدرسة النور']);
        $schoolB = School::factory()->create(['name' => 'مدرسة الأمل']);

        $busA = Bus::factory()->create(['school_id' => $schoolA->id, 'bus_number' => 'BUS-A1']);
        $busB = Bus::factory()->create(['school_id' => $schoolB->id, 'bus_number' => 'BUS-B1']);

        $response = $this->actingAs($admin)->get(route('admin.buses.tracking.api', ['school_id' => $schoolA->id]));

        $response->assertStatus(200);
        $buses = collect($response->json('buses'));
        $this->assertTrue($buses->contains('id', $busA->id));
        $this->assertFalse($buses->contains('id', $busB->id));
    }

    public function test_tracking_api_can_filter_by_bus(): void
    {
        $admin = $this->createAdmin();
        $school = School::factory()->create(['name' => 'مدرسة التفوق']);
        $bus1 = Bus::factory()->create(['school_id' => $school->id, 'bus_number' => 'BUS-101']);
        $bus2 = Bus::factory()->create(['school_id' => $school->id, 'bus_number' => 'BUS-102']);

        $response = $this->actingAs($admin)->get(route('admin.buses.tracking.api', ['bus_id' => $bus1->id]));

        $response->assertStatus(200);
        $buses = collect($response->json('buses'));
        $this->assertCount(1, $buses);
        $this->assertEquals($bus1->id, $buses->first()['id']);
    }
}
