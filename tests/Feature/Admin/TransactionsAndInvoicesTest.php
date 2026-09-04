<?php

namespace Tests\Feature\Admin;

use App\Models\Bus;
use App\Models\BusExpense;
use App\Models\Installment;
use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\School;
use App\Models\Subscription;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class TransactionsAndInvoicesTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    public function test_admin_can_view_transactions_page(): void
    {
        $admin = $this->createAdmin();
        $school = School::factory()->create();

        PaymentTransaction::create([
            'school_id' => $school->id,
            'amount' => 1500.00,
            'reference_number' => 'TXN-998877',
            'payment_method' => 'bank_transfer',
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        $response = $this->actingAs($admin)->get(route('admin.transactions.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Transactions/Index')
            ->has('transactions.data', 1)
        );
    }

    public function test_admin_can_view_and_store_bus_expenses(): void
    {
        $admin = $this->createAdmin();
        $school = School::factory()->create();
        $bus = Bus::factory()->create(['school_id' => $school->id]);

        BusExpense::create([
            'bus_id' => $bus->id,
            'type' => 'maintenance',
            'amount' => 450.00,
            'date' => now()->toDateString(),
            'extra_info' => 'تغيير زيت وفلاتر',
        ]);

        $response = $this->actingAs($admin)->get(route('admin.bus-expenses.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/BusExpenses/Index')
            ->has('expenses.data', 1)
            ->has('stats')
        );

        $storeResponse = $this->actingAs($admin)->post(route('admin.bus-expenses.store'), [
            'bus_id' => $bus->id,
            'type' => 'fuel',
            'amount' => 180.00,
            'date' => now()->toDateString(),
            'extra_info' => 'بنزين 91',
        ]);

        $storeResponse->assertRedirect();
        $this->assertDatabaseHas('bus_expenses', [
            'bus_id' => $bus->id,
            'type' => 'fuel',
            'amount' => 180.00,
        ]);
    }

    public function test_school_admin_can_fetch_invoices_and_log_payment(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $plan = Plan::factory()->create();
        $subscription = Subscription::factory()->create([
            'school_id' => $school->id,
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);

        $installment = Installment::factory()->create([
            'school_id' => $school->id,
            'subscription_id' => $subscription->id,
            'amount' => 1000.00,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($schoolAdmin);

        $response = $this->getJson('/api/invoices/my');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json());

        // Log payment for installment
        $payResponse = $this->postJson("/api/invoices/{$installment->id}/payment", [
            'amount' => 1000.00,
            'payment_method' => 'bank_transfer',
            'reference_number' => 'TXN-PAY-12345',
        ]);

        $payResponse->assertStatus(200);
        $payResponse->assertJson(['success' => true]);

        $installment->refresh();
        $this->assertEquals('paid', $installment->status);
    }
}
