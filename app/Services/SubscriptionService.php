<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SubscriptionService
{
    /**
     * Subscribe a school to a plan (pending approval)
     */
    public function assignPlanToSchool(int $schoolId, int $planId): array
    {
        return DB::transaction(function () use ($schoolId, $planId) {
            $plan = Plan::findOrFail($planId);
            $school = \App\Models\School::findOrFail($schoolId);

            // Cancel existing active/pending subscriptions
            Subscription::where('school_id', $schoolId)
                ->whereIn('status', ['active', 'pending_approval'])
                ->update(['status' => 'cancelled']);

            // Create new pending subscription
            $subscription = Subscription::create([
                'plan_id' => $plan->id,
                'school_id' => $schoolId,
                'status' => 'pending_approval',
                'start_date' => Carbon::now()->toDateString(),
                'end_date' => Carbon::now()->toDateString(), // Will be updated on approval
            ]);

            return ['subscription' => $subscription];
        });
    }

    /**
     * Admin approves subscription and generates installment schedule
     */
    public function approveSubscription(int $subscriptionId, int $installmentsCount = 1, float $prorationCredit = 0): array
    {
        return DB::transaction(function () use ($subscriptionId, $installmentsCount, $prorationCredit) {
            $subscription = Subscription::with('plan')->findOrFail($subscriptionId);
            $plan = $subscription->plan;

            [$startDate, $endDate] = $this->calculateDates($plan);

            $subscription->update([
                'status' => 'active',
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]);

            if ($plan->price_per_student > 0) {
                // Calculation: max_buses * 20 students per bus * price per student
                $busCapacity = 20;
                $maxBuses = $plan->max_buses ?: 1; // Fallback to 1 if not set
                $totalAmount = ($maxBuses * $busCapacity * $plan->price_per_student) - $prorationCredit;

                $description = "Subscription Plan - {$plan->name} (" . ($prorationCredit > 0 ? "Prorated Upgrade" : "{$maxBuses} Buses x {$busCapacity} Students x \${$plan->price_per_student}") . ")";

                // Create installments directly
                $installmentAmount = $totalAmount / $installmentsCount;
                $daysBetween = match($installmentsCount) {
                    1 => 0,
                    2 => 180, // Half year
                    3 => 120, // Quarterly
                    4 => 90,  // Quarterly
                    12 => 30, // Monthly
                    default => floor(365 / $installmentsCount),
                };

                for ($i = 1; $i <= $installmentsCount; $i++) {
                    $dueDate = $i === 1 
                        ? Carbon::now()->addDays(7) 
                        : Carbon::now()->addDays(7 + ($daysBetween * ($i - 1)));

                    \App\Models\Installment::create([
                        'school_id' => $subscription->school_id,
                        'subscription_id' => $subscription->id,
                        'installment_number' => $i,
                        'amount' => $installmentAmount,
                        'due_date' => $dueDate->toDateString(),
                        'status' => 'pending',
                        'notes' => $description
                    ]);
                }
            }

            return ['subscription' => $subscription];
        });
    }

    /**
     * Admin rejects subscription
     */
    public function rejectSubscription(int $subscriptionId): void
    {
        $subscription = Subscription::findOrFail($subscriptionId);
        $subscription->update(['status' => 'cancelled']);
        
        // Remove plan from school if it's the current one (Legacy cleanup - no longer needed with schema change)
        // $school = \App\Models\School::find($subscription->school_id);

    }

    /**
     * Pay an installment with partial/overpayment support
     */
    public function payInstallment(int $installmentId, float $amount, string $paymentMethod, ?string $referenceNumber = null): void
    {
        DB::transaction(function () use ($installmentId, $amount, $paymentMethod, $referenceNumber) {
            $installment = \App\Models\Installment::findOrFail($installmentId);

            // 1. Create the Transaction Receipt
            $transaction = \App\Models\PaymentTransaction::create([
                'school_id' => $installment->school_id,
                'amount' => $amount,
                'payment_method' => $paymentMethod,
                'reference_number' => $referenceNumber,
                'paid_at' => now(),
            ]);

            // 2. Process the money across installments
            $this->processPayment($installment, $amount, $transaction);
        });
    }

    /**
     * Process payment recursively for overflows
     */
    private function processPayment(\App\Models\Installment $installment, float $amount, \App\Models\PaymentTransaction $transaction): void
    {
        if ($amount <= 0) return;

        $remainingNeeded = $installment->remaining_amount;
        $paymentForThis = min($amount, $remainingNeeded);
        $excess = max(0, $amount - $remainingNeeded);

        $newPaidAmount = $installment->paid_amount + $paymentForThis;
        $status = 'partially_paid';
        
        if ($newPaidAmount >= $installment->amount) {
            $status = 'paid';
        }

        // Update the installment (Debt status)
        $installment->update([
            'paid_amount' => $newPaidAmount,
            'status' => $status,
        ]);

        // Create the application record (The "Complement")
        \App\Models\InstallmentPayment::create([
            'payment_transaction_id' => $transaction->id,
            'installment_id' => $installment->id,
            'amount' => $paymentForThis,
        ]);

        // If there is excess, apply to the next pending installment
        if ($excess > 0) {
            $nextInstallment = \App\Models\Installment::where('school_id', $installment->school_id)
                ->where('subscription_id', $installment->subscription_id)
                ->whereIn('status', ['pending', 'partially_paid', 'overdue'])
                ->where('id', '>', $installment->id)
                ->orderBy('installment_number')
                ->first();

            if ($nextInstallment) {
                $this->processPayment($nextInstallment, $excess, $transaction);
            }
        }
    }


    /**
     * Get school billing data
     */
    public function getSchoolBillingData(int $schoolId): array
    {
        $school = \App\Models\School::findOrFail($schoolId);
        $currentPlan = $school->currentSubscription?->plan;
        
        $installments = \App\Models\Installment::with(['subscription.plan'])
            ->where('school_id', $schoolId)
            ->latest('due_date')
            ->get();

        $totalOwed = $installments->whereIn('status', ['pending', 'overdue'])->sum('amount');
        $totalPaid = $installments->where('status', 'paid')->sum('amount');

        $transactions = \App\Models\PaymentTransaction::with(['installmentPayments.installment.subscription.plan'])
            ->where('school_id', $schoolId)
            ->latest('paid_at')
            ->get();

        return [
            'current_plan' => $currentPlan,
            'total_owed' => $totalOwed,
            'total_paid' => $totalPaid,
            'installments' => $installments,
            'upcoming_installments' => $installments->where('status', '!=', 'paid')->sortBy('due_date')->values(),
            'transactions' => $transactions,
        ];
    }
    
    /**
     * Subscribe a school to an attendance plan (legacy method support)
     */
    public function subscribeSchoolToAttendance(int $schoolId, int $planId): array
    {
        return $this->assignPlanToSchool($schoolId, $planId);
    }

    /**
     * Enroll multiple students in a transport plan (legacy method support)
     */
    public function subscribeStudentsToTransport(int $schoolId, array $studentIds, int $planId): array
    {
        return $this->assignPlanToSchool($schoolId, $planId);
    }

    /**
     * Calculate start and end dates based on the billing cycle.
     */
    private function calculateDates(Plan $plan): array
    {
        $startDate = Carbon::now();
        $endDate = clone $startDate;

        switch ($plan->billing_cycle) {
            case 'monthly':
                $endDate->addMonth();
                break;
            case 'yearly':
                $endDate->addYear();
                break;
            case 'trial':
                $endDate->addDays($plan->trial_days ?? 14);
                break;
        }

        return [$startDate->toDateString(), $endDate->toDateString()];
    }
}
