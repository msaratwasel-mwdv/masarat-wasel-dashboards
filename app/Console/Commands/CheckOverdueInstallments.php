<?php

namespace App\Console\Commands;

use App\Models\Installment;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckOverdueInstallments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'installments:check-overdue';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for overdue installments and send reminders to schools';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting overdue installments check...');

        // 1. Remind 7 days before due date
        $upcomingInstallments = Installment::with(['school.users', 'subscription'])
            ->where('status', 'pending')
            ->where('verification_status', '!=', 'pending') // Hasn't uploaded receipt
            ->whereDate('due_date', Carbon::today()->addDays(7))
            ->get();

        foreach ($upcomingInstallments as $installment) {
            $school = $installment->school;
            if ($school && $school->contact_email) {
                try {
                    \Illuminate\Support\Facades\Mail::to($school->contact_email)->send(new \App\Mail\PaymentReminderEmail($installment, false));
                    Log::info("Sent upcoming reminder: Installment #{$installment->installment_number} for School ID {$installment->school_id} is due in 7 days.");
                } catch (\Exception $e) {
                    Log::error("Failed to send upcoming reminder for School {$school->name}: ".$e->getMessage());
                }
            }
        }

        // 2. Mark as overdue if past due date
        $overdueInstallments = Installment::with(['subscription', 'school'])
            ->where('status', 'pending')
            ->whereDate('due_date', '<', Carbon::today())
            ->get();

        foreach ($overdueInstallments as $installment) {
            $installment->update(['status' => 'overdue']);

            // Set a grace period end date if not already set on the subscription
            $subscription = $installment->subscription;
            if ($subscription && ! $subscription->grace_period_ends_at) {
                $subscription->update([
                    'grace_period_ends_at' => Carbon::parse($installment->due_date)->addDays(7),
                ]);
            }

            $school = $installment->school;
            if ($school) {
                if ($school->contact_email) {
                    try {
                        \Illuminate\Support\Facades\Mail::to($school->contact_email)->send(new \App\Mail\PaymentReminderEmail($installment, true));
                        Log::warning("Sent overdue reminder: Installment #{$installment->installment_number} for School ID {$installment->school_id} is marked as overdue.");
                    } catch (\Exception $e) {
                        Log::error("Failed to send overdue reminder for School {$school->name}: ".$e->getMessage());
                    }
                }

                // Notify general admins about the overdue installment (grace period started)
                try {
                    app(\App\Services\NotificationService::class)->notifyCompanyAdmins(
                        type: 'subscription_overdue',
                        title: 'تنبيه: قسط متأخر لمدرسة '.$school->name,
                        message: "تأخر سداد القسط رقم #{$installment->installment_number} لمدرسة ({$school->name}). بدأت فترة السماح وتنتهي بتاريخ ".Carbon::parse($installment->due_date)->addDays(7)->toDateString(),
                        data: [
                            'school_id' => $school->id,
                            'installment_id' => $installment->id,
                            'subscription_id' => $subscription->id ?? null,
                        ],
                        titleEn: 'Alert: Overdue Installment for '.$school->name,
                        messageEn: "Payment for installment #{$installment->installment_number} for ({$school->name}) is overdue. Grace period started and ends on ".Carbon::parse($installment->due_date)->addDays(7)->toDateString()
                    );
                } catch (\Exception $e) {
                    Log::error('Failed to notify company admins of overdue installment: '.$e->getMessage());
                }
            }
        }

        // 3. Grace period about to end (in exactly 2 days)
        $aboutToExpireSubscriptions = \App\Models\Subscription::with('school')
            ->where('status', 'active')
            ->whereNotNull('grace_period_ends_at')
            ->whereDate('grace_period_ends_at', Carbon::today()->addDays(2))
            ->get();

        foreach ($aboutToExpireSubscriptions as $sub) {
            $schoolName = $sub->school->name ?? 'مدرسة';
            try {
                app(\App\Services\NotificationService::class)->notifyCompanyAdmins(
                    type: 'subscription_grace_expiring',
                    title: 'تنبيه: اقتراب انتهاء مهلة سداد '.$schoolName,
                    message: "ستنتهي فترة السماح الممنوحة لمدرسة ({$schoolName}) خلال يومين بتاريخ ".Carbon::parse($sub->grace_period_ends_at)->toDateString(),
                    data: [
                        'school_id' => $sub->school_id,
                        'subscription_id' => $sub->id,
                    ],
                    titleEn: 'Alert: Grace Period Ending Soon for '.$schoolName,
                    messageEn: "The grace period for ({$schoolName}) will end in 2 days on ".Carbon::parse($sub->grace_period_ends_at)->toDateString()
                );
            } catch (\Exception $e) {
                Log::error('Failed to notify admins of grace period expiring: '.$e->getMessage());
            }
        }

        // 4. Grace period ended today (restricted)
        $expiredGraceSubscriptions = \App\Models\Subscription::with('school')
            ->where('status', 'active')
            ->whereNotNull('grace_period_ends_at')
            ->whereDate('grace_period_ends_at', Carbon::today())
            ->get();

        foreach ($expiredGraceSubscriptions as $sub) {
            $schoolName = $sub->school->name ?? 'مدرسة';
            try {
                app(\App\Services\NotificationService::class)->notifyCompanyAdmins(
                    type: 'subscription_grace_expired',
                    title: 'تنبيه: انتهت مهلة سداد '.$schoolName,
                    message: "انتهت فترة السماح الممنوحة لمدرسة ({$schoolName}) وتم تعليق عمليات التعديل والإضافة تلقائياً في النظام.",
                    data: [
                        'school_id' => $sub->school_id,
                        'subscription_id' => $sub->id,
                    ],
                    titleEn: 'Alert: Grace Period Expired for '.$schoolName,
                    messageEn: "The grace period for ({$schoolName}) has expired. Modify/Create operations are now restricted."
                );
            } catch (\Exception $e) {
                Log::error('Failed to notify admins of grace period expiration: '.$e->getMessage());
            }
        }

        // 5. Subscription ended today (expired)
        $endedSubscriptions = \App\Models\Subscription::with('school')
            ->where('status', 'active')
            ->whereDate('end_date', '<=', Carbon::today())
            ->get();

        foreach ($endedSubscriptions as $sub) {
            $sub->update(['status' => 'expired']);
            $schoolName = $sub->school->name ?? 'مدرسة';
            try {
                app(\App\Services\NotificationService::class)->notifyCompanyAdmins(
                    type: 'subscription_expired',
                    title: 'تنبيه: انتهى اشتراك '.$schoolName,
                    message: "انتهت مدة الاشتراك لمدرسة ({$schoolName}) وتم تغيير حالة الاشتراك إلى منتهي.",
                    data: [
                        'school_id' => $sub->school_id,
                        'subscription_id' => $sub->id,
                    ],
                    titleEn: 'Alert: Subscription Expired for '.$schoolName,
                    messageEn: "The subscription duration for ({$schoolName}) has ended and status is set to expired."
                );
            } catch (\Exception $e) {
                Log::error('Failed to notify admins of subscription expiry: '.$e->getMessage());
            }
        }

        $this->info('Finished checking overdue installments.');
    }
}
