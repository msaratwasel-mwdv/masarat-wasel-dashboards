<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Installment;
use Carbon\Carbon;
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
            // Placeholder for email/notification system
            // \Illuminate\Support\Facades\Notification::send($installment->school->users, new InstallmentReminderNotification($installment));
            Log::info("Reminder: Installment #{$installment->installment_number} for School ID {$installment->school_id} is due in 7 days.");
        }

        // 2. Mark as overdue if past due date
        $overdueInstallments = Installment::with(['subscription'])
            ->where('status', 'pending')
            ->whereDate('due_date', '<', Carbon::today())
            ->get();

        foreach ($overdueInstallments as $installment) {
            $installment->update(['status' => 'overdue']);
            
            // Set a grace period end date if not already set on the subscription
            $subscription = $installment->subscription;
            if ($subscription && !$subscription->grace_period_ends_at) {
                $subscription->update([
                    'grace_period_ends_at' => Carbon::parse($installment->due_date)->addDays(7)
                ]);
            }
            
            Log::warning("Installment #{$installment->installment_number} for School ID {$installment->school_id} marked as overdue.");
        }

        $this->info('Finished checking overdue installments.');
    }
}
