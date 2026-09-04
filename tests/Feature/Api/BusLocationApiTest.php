<?php

namespace Tests\Feature\Api;

use App\Events\BusLocationUpdated;
use App\Events\DriverLocationUpdated;
use App\Models\Bus;
use App\Models\Plan;
use App\Models\School;
use App\Models\Student;
use App\Models\Subscription;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class BusLocationApiTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    public function test_driver_can_update_assigned_bus_location_and_broadcast_events(): void
    {
        Event::fake([BusLocationUpdated::class, DriverLocationUpdated::class]);

        $school = School::factory()->create(['is_active' => true]);
        $plan = Plan::factory()->create();
        Subscription::factory()->create([
            'school_id' => $school->id,
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);

        $driver = $this->createDriver();
        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
            'latitude' => 15.3694,
            'longitude' => 44.1910,
        ]);

        Sanctum::actingAs($driver);

        $response = $this->postJson("/api/bus/{$bus->id}/location", [
            'latitude' => 15.3750,
            'longitude' => 44.2000,
            'heading' => 90,
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['message', 'location']);

        $bus->refresh();
        $this->assertEquals(15.3750, (float) $bus->latitude);
        $this->assertEquals(44.2000, (float) $bus->longitude);

        Event::assertDispatched(BusLocationUpdated::class, function ($e) use ($bus) {
            return $e->bus->id === $bus->id && (float) $e->latitude === 15.3750 && (float) $e->longitude === 44.2000;
        });

        Event::assertDispatched(DriverLocationUpdated::class);
    }

    public function test_unauthorized_user_cannot_update_bus_location(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $plan = Plan::factory()->create();
        Subscription::factory()->create([
            'school_id' => $school->id,
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);

        $driver1 = $this->createDriver();
        $driver2 = $this->createDriver();

        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver1->id,
        ]);

        // driver2 tries to update bus of driver1
        Sanctum::actingAs($driver2);

        $response = $this->postJson("/api/bus/{$bus->id}/location", [
            'latitude' => 15.3750,
            'longitude' => 44.2000,
        ]);

        $response->assertStatus(403);
    }

    public function test_guardian_can_view_assigned_bus_location(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $driver = $this->createDriver();
        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
            'latitude' => 15.3694,
            'longitude' => 44.1910,
        ]);

        $guardian = $this->createGuardian();
        $student = Student::factory()->create([
            'forth_bus_id' => $bus->id,
            'is_active' => true,
        ]);
        $student->guardians()->attach($guardian->id, ['relationship_type' => 'father']);

        Sanctum::actingAs($guardian);

        $response = $this->getJson("/api/bus/{$bus->id}/location");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'latitude',
            'longitude',
        ]);
        $this->assertEquals(15.3694, (float) $response->json('latitude'));
    }

    public function test_unrelated_guardian_cannot_view_bus_location(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $driver = $this->createDriver();
        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
        ]);

        $unrelatedGuardian = $this->createGuardian();

        Sanctum::actingAs($unrelatedGuardian);

        $response = $this->getJson("/api/bus/{$bus->id}/location");

        $response->assertStatus(403);
    }
}
