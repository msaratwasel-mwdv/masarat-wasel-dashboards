<?php

namespace Tests\Feature\Admin;

use App\Models\Bus;
use App\Models\Incident;
use App\Models\School;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class EmergencyManagementTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    public function test_guest_cannot_access_emergency_monitor(): void
    {
        $response = $this->get(route('admin.emergencies.index'));
        $response->assertRedirect(route('login'));
    }

    public function test_admin_can_view_emergency_monitor_dashboard(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get(route('admin.emergencies.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Reports/EmergencyMonitor')
            ->has('activeIncidents')
            ->has('resolvedIncidents')
        );
    }

    public function test_admin_can_resolve_incident(): void
    {
        $admin = $this->createAdmin();
        $school = School::factory()->create();
        $driver = $this->createDriver();
        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
        ]);

        $incident = Incident::factory()->create([
            'bus_id' => $bus->id,
            'reporter_id' => $driver->id,
            'status' => 'active',
        ]);

        $response = $this->actingAs($admin)
            ->from(route('admin.emergencies.index'))
            ->put(route('admin.emergencies.update-status', $incident), [
                'status' => 'resolved',
            ]);

        $response->assertRedirect(route('admin.emergencies.index'));
        $response->assertSessionHas('success');

        $incident->refresh();
        $this->assertEquals('resolved', $incident->status);
        $this->assertEquals($admin->id, $incident->resolved_by);
    }

    public function test_admin_can_delete_incident(): void
    {
        $admin = $this->createAdmin();
        $school = School::factory()->create();
        $bus = Bus::factory()->create(['school_id' => $school->id]);

        $incident = Incident::factory()->create([
            'bus_id' => $bus->id,
            'reporter_id' => $admin->id,
            'status' => 'resolved',
        ]);

        $response = $this->actingAs($admin)
            ->from(route('admin.emergencies.index'))
            ->delete(route('admin.emergencies.destroy', $incident));

        $response->assertRedirect(route('admin.emergencies.index'));
        $this->assertSoftDeleted('incidents', ['id' => $incident->id]);
    }
}
