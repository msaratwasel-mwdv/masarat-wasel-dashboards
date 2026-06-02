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
    public function approveSubscription(int $subscriptionId, int $installmentsCount = 1, float $pricePerStudent = 0): array
    {
        return DB::transaction(function () use ($subscriptionId, $installmentsCount, $pricePerStudent) {
            $subscription = Subscription::with(['plan', 'school'])->findOrFail($subscriptionId);
            $plan = $subscription->plan;
            $school = $subscription->school;

            // Activate school
            $school->update(['is_active' => true]);

            // Ensure the user exists and is linked properly (fallback just in case)
            $adminUser = \App\Models\User::where('email', $school->contact_email)->first();
            if ($adminUser) {
                // Send approval email
                try {
                    \Illuminate\Support\Facades\Mail::to($school->contact_email)->send(new \App\Mail\SchoolSubscriptionApproved($school));
                    \Illuminate\Support\Facades\Log::info("Sent approval email to school: {$school->name}");
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to send approval email to school: {$school->name}. Error: " . $e->getMessage());
                }
            } else {
                \Illuminate\Support\Facades\Log::warning("Could not find admin user for school: {$school->name} during approval.");
            }

            [$startDate, $endDate] = $this->calculateDates($plan);

            $notes = $subscription->notes ?? [];
            $projectedStudentCount = $notes['student_count'] ?? 0;
            $notes['approved_price_per_student'] = $pricePerStudent;
            
            $totalAmount = $projectedStudentCount * $pricePerStudent;

            $subscription->update([
                'status' => 'active',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'final_price' => $totalAmount,
                'notes' => $notes,
            ]);

            if ($totalAmount > 0) {
                $description = "Subscription Plan - {$plan->name} (Price per student: {$pricePerStudent}, Initial students: {$projectedStudentCount})";

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
     * Recalculates pending installments dynamically based on current student count.
     */
    public function recalculatePendingInstallments(int $schoolId): void
    {
        DB::transaction(function () use ($schoolId) {
            $school = \App\Models\School::findOrFail($schoolId);
            $subscription = $school->currentSubscription;

            if (!$subscription || $subscription->status !== 'active') {
                return;
            }

            $pricePerStudent = $subscription->notes['approved_price_per_student'] ?? 0;
            if ($pricePerStudent <= 0) return;

            // Get actual student count
            $actualStudentCount = \App\Models\Student::inSchool($schoolId)->count();
            
            $newTotalAmount = $actualStudentCount * $pricePerStudent;
            
            // Update the subscription's final price to reflect the new reality
            $subscription->update(['final_price' => $newTotalAmount]);

            $installments = \App\Models\Installment::where('subscription_id', $subscription->id)
                                                   ->orderBy('installment_number')
                                                   ->get();
            $totalInvoicedAmount = $installments->sum('amount');
            $difference = $newTotalAmount - $totalInvoicedAmount;

            if (abs($difference) < 0.01) return;

            $pendingInstallments = $installments->where('status', 'pending');
            $pendingCount = $pendingInstallments->count();

            if ($difference > 0) {
                // We need to bill more (e.g. students added)
                if ($pendingCount > 0) {
                    $extraPerPending = $difference / $pendingCount;
                    foreach ($pendingInstallments as $installment) {
                        $installment->update([
                            'amount' => $installment->amount + $extraPerPending,
                            'notes' => $installment->notes . " | Adjusted (+{$extraPerPending}). Students: {$actualStudentCount}"
                        ]);
                    }
                } else {
                    // Create Adjustment Invoice
                    $lastInstallment = $installments->last();
                    $newNumber = $lastInstallment ? $lastInstallment->installment_number + 1 : 1;
                    
                    \App\Models\Installment::create([
                        'school_id' => $subscription->school_id,
                        'subscription_id' => $subscription->id,
                        'installment_number' => $newNumber,
                        'amount' => $difference,
                        'due_date' => Carbon::now()->toDateString(), // Due immediately
                        'status' => 'pending',
                        'notes' => "Adjustment Invoice: Added students after existing installments were processed. Students: {$actualStudentCount}, Rate: {$pricePerStudent}"
                    ]);
                }
            } else {
                // We need to bill less (e.g. students removed)
                $reductionNeeded = abs($difference);
                
                // Try to reduce pending installments first, starting from the last one
                foreach ($pendingInstallments->reverse() as $installment) {
                    if ($reductionNeeded <= 0.01) break;
                    
                    $reducibleAmount = $installment->amount - $installment->paid_amount;
                    if ($reducibleAmount <= 0) continue;
                    
                    if ($reductionNeeded >= $reducibleAmount) {
                        // Completely wipe out this installment's unpaid portion
                        $installment->update([
                            'amount' => $installment->paid_amount,
                            'status' => $installment->paid_amount > 0 ? 'paid' : 'cancelled',
                            'notes' => $installment->notes . " | Cancelled/Reduced due to student reduction."
                        ]);
                        $reductionNeeded -= $reducibleAmount;
                    } else {
                        // Partially reduce this installment
                        $installment->update([
                            'amount' => $installment->amount - $reductionNeeded,
                            'notes' => $installment->notes . " | Reduced (-{$reductionNeeded}) due to student reduction."
                        ]);
                        $reductionNeeded = 0;
                    }
                }
                
                // If reductionNeeded > 0, it cuts into overdue or partially_paid installments
                if ($reductionNeeded > 0.01) {
                    $otherUnpaid = $installments->whereIn('status', ['overdue', 'partially_paid'])->reverse();
                    foreach ($otherUnpaid as $installment) {
                        if ($reductionNeeded <= 0.01) break;
                        $reducibleAmount = $installment->amount - $installment->paid_amount;
                        if ($reducibleAmount <= 0) continue;
                        
                        if ($reductionNeeded >= $reducibleAmount) {
                            $installment->update([
                                'amount' => $installment->paid_amount,
                                'status' => 'paid',
                                'notes' => $installment->notes . " | Debt waived due to student reduction."
                            ]);
                            $reductionNeeded -= $reducibleAmount;
                        } else {
                            $installment->update([
                                'amount' => $installment->amount - $reductionNeeded,
                                'notes' => $installment->notes . " | Debt reduced (-{$reductionNeeded}) due to student reduction."
                            ]);
                            $reductionNeeded = 0;
                        }
                    }
                }
            }
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
            } else {
                // Log unallocated excess
                $transaction->update([
                    'notes' => trim($transaction->notes . " | Unallocated Overpayment: {$excess}")
                ]);
            }
        }
    }


    /**
     * Get school billing data
     */
    public function getSchoolBillingData(int $schoolId): array
    {
        $school = \App\Models\School::findOrFail($schoolId);
        $subscription = $school->currentSubscription;
        $currentPlan = $subscription?->plan;
        
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
            'subscription' => $subscription,
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
