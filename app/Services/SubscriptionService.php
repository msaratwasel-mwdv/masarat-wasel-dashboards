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
     * Subscribe a school to an attendance plan.
     */
    public function subscribeSchoolToAttendance(int $schoolId, int $planId): array
    {
        return DB::transaction(function () use ($schoolId, $planId) {
            $plan = Plan::findOrFail($planId);
            
            if ($plan->type !== 'attendance') {
                throw new \Exception("Plan is not an attendance plan.");
            }

            [$startDate, $endDate] = $this->calculateDates($plan);

            $subscription = Subscription::create([
                'plan_id' => $plan->id,
                'school_id' => $schoolId,
                'student_id' => null,
                'status' => $plan->price > 0 ? 'pending_payment' : 'trialing',
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]);

            $invoice = null;
            if ($plan->price > 0) {
                $invoice = Invoice::create([
                    'school_id' => $schoolId,
                    'total_amount' => $plan->price,
                    'due_date' => Carbon::now()->addDays(7)->toDateString(),
                    'status' => 'unpaid'
                ]);

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'subscription_id' => $subscription->id,
                    'amount' => $plan->price,
                    'description' => "Attendance Subscription - {$plan->name}"
                ]);
            }

            return ['subscription' => $subscription, 'invoice' => $invoice];
        });
    }

    /**
     * Enroll multiple students in a transport plan.
     */
    public function subscribeStudentsToTransport(int $schoolId, array $studentIds, int $planId): array
    {
        return DB::transaction(function () use ($schoolId, $studentIds, $planId) {
            $plan = Plan::findOrFail($planId);
            
            if ($plan->type !== 'transport') {
                throw new \Exception("Plan is not a transport plan.");
            }

            [$startDate, $endDate] = $this->calculateDates($plan);

            $invoice = null;
            $totalAmount = $plan->price * count($studentIds);

            if ($totalAmount > 0) {
                $invoice = Invoice::create([
                    'school_id' => $schoolId,
                    'total_amount' => $totalAmount,
                    'due_date' => Carbon::now()->addDays(7)->toDateString(),
                    'status' => 'unpaid'
                ]);
            }

            $subscriptions = [];
            foreach ($studentIds as $studentId) {
                $sub = Subscription::create([
                    'plan_id' => $plan->id,
                    'school_id' => $schoolId,
                    'student_id' => $studentId,
                    'status' => $plan->price > 0 ? 'pending_payment' : 'active',
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ]);
                
                $subscriptions[] = $sub;

                if ($invoice) {
                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'subscription_id' => $sub->id,
                        'amount' => $plan->price,
                        'description' => "Transport Subscription - {$plan->name} for Student #{$studentId}"
                    ]);
                }
            }

            return ['subscriptions' => $subscriptions, 'invoice' => $invoice];
        });
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
