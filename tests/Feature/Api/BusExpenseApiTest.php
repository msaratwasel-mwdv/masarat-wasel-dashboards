<?php

namespace Tests\Feature\Api;

use App\Models\Bus;
use App\Models\BusExpense;
use App\Models\Plan;
use App\Models\School;
use App\Models\Subscription;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class BusExpenseApiTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_driver_without_assigned_bus_cannot_view_or_store_expenses(): void
    {
        $driver = $this->createDriver();
        Sanctum::actingAs($driver);

        $response = $this->getJson('/api/driver/expenses');
        $response->assertStatus(403);

        $storeResponse = $this->postJson('/api/driver/expenses', [
            'type' => 'fuel',
            'amount' => 100,
            'date' => now()->toDateString(),
        ]);
        $storeResponse->assertStatus(403);
    }

    public function test_driver_can_list_assigned_bus_expenses(): void
    {
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
        ]);

        BusExpense::create([
            'bus_id' => $bus->id,
            'type' => 'fuel',
            'amount' => 150.00,
            'date' => now()->toDateString(),
            'extra_info' => '10000 km',
        ]);

        Sanctum::actingAs($driver);

        $response = $this->getJson('/api/driver/expenses');

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $response->assertJsonCount(1, 'data');
        $this->assertEquals('fuel', $response->json('data.0.type'));
    }

    public function test_driver_can_store_fuel_expense_with_receipt(): void
    {
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
        ]);

        Sanctum::actingAs($driver);

        $file = UploadedFile::fake()->image('receipt.jpg');

        $response = $this->postJson('/api/driver/expenses', [
            'type' => 'fuel',
            'amount' => 220.50,
            'date' => now()->toDateString(),
            'extra_info' => '12000 km',
            'receipt_photo' => $file,
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $this->assertDatabaseHas('bus_expenses', [
            'bus_id' => $bus->id,
            'type' => 'fuel',
            'amount' => 220.50,
            'extra_info' => '12000 km',
        ]);

        $expense = BusExpense::where('bus_id', $bus->id)->first();
        $this->assertNotNull($expense->receipt_photo);
        Storage::disk('public')->assertExists($expense->receipt_photo);
    }

    public function test_odometer_guard_blocks_odometer_lower_than_previous(): void
    {
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
        ]);

        // Prior expense with 15000 km
        BusExpense::create([
            'bus_id' => $bus->id,
            'type' => 'fuel',
            'amount' => 100.00,
            'date' => now()->subDay()->toDateString(),
            'extra_info' => '15000 km',
        ]);

        Sanctum::actingAs($driver);

        // Attempt new expense with lower odometer (14000 km)
        $response = $this->postJson('/api/driver/expenses', [
            'type' => 'fuel',
            'amount' => 120.00,
            'date' => now()->toDateString(),
            'extra_info' => '14000 km',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['extra_info']);
    }
}
