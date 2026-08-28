<?php

namespace Tests\Unit\Models;

use App\Models\Installment;
use App\Models\InstallmentPayment;
use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\School;
use App\Models\Subscription;
use Tests\TestCase;

class FinancialAndSubscriptionModelTest extends TestCase
{
    public function test_plan_creation_and_attributes(): void
    {
        $plan = Plan::factory()->create([
            'name' => 'الباقة الماسية',
            'price_per_student' => 75.00,
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('plans', ['id' => $plan->id]);
        $this->assertTrue($plan->is_active);
    }

    public function test_subscription_relationships_and_scopes(): void
    {
        $school = School::factory()->create();
        $plan = Plan::factory()->create();

        $activeSub = Subscription::factory()->create([
            'school_id' => $school->id,
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);

        $pendingSub = Subscription::factory()->pendingApproval()->create([
            'school_id' => $school->id,
            'plan_id' => $plan->id,
        ]);

        $this->assertEquals($plan->id, $activeSub->plan->id);
        $this->assertEquals($school->id, $activeSub->school->id);

        $activeList = Subscription::active()->get();
        $this->assertTrue($activeList->contains('id', $activeSub->id));
        $this->assertFalse($activeList->contains('id', $pendingSub->id));

        $this->assertTrue($pendingSub->isPendingApproval());
        $this->assertFalse($activeSub->isPendingApproval());
    }

    public function test_installment_and_payments_relationships(): void
    {
        $school = School::factory()->create();
        $subscription = Subscription::factory()->create(['school_id' => $school->id]);

        $installment = Installment::factory()->create([
            'school_id' => $school->id,
            'subscription_id' => $subscription->id,
            'amount' => 1000.00,
            'paid_amount' => 400.00,
            'status' => 'pending',
        ]);

        $this->assertEquals(600.00, $installment->remaining_amount);

        $transaction = PaymentTransaction::create([
            'school_id' => $school->id,
            'amount' => 400.00,
            'payment_method' => 'bank_transfer',
            'reference_number' => 'REF-998877',
            'paid_at' => now(),
        ]);

        $paymentLink = InstallmentPayment::create([
            'payment_transaction_id' => $transaction->id,
            'installment_id' => $installment->id,
            'amount' => 400.00,
        ]);

        $this->assertTrue($installment->installmentPayments->contains('id', $paymentLink->id));
        $this->assertTrue($installment->payments->contains('id', $transaction->id));
        $this->assertTrue($transaction->installmentPayments->contains('id', $paymentLink->id));
    }
}
