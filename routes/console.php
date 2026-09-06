<?php

use App\Models\Notification;
use App\Models\NotificationRecipient;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('model:prune')->daily();
Schedule::command('telescope:prune --hours=24')->daily();

// Auto-create daily (forth & back) trips for all buses with routes at 02:00 AM Oman time (Asia/Muscat)
Schedule::command('trips:create-daily')->dailyAt('02:00')->timezone('Asia/Muscat');

// 🧪 سطر تجريبي مؤقت للاختبار على الاستضافة: ينفذ الساعة 01:15 فجراً (و 01:20 كاحتياط لو تأخر الـ Deploy) بتوقيت عمان
Schedule::command('trips:create-daily')->cron('15,20 1 * * *')->timezone('Asia/Muscat');

// Cleanup trip verification videos older than 30 days
Schedule::command('trips:cleanup-videos')->dailyAt('03:00');

// Auto-close trips in awaiting_video status that exceed 30 minutes, and alert admins
Schedule::command('trips:auto-close-awaiting-video')->everyMinute();

// Prune all notifications older than 24 hours hourly
Schedule::call(function () {
    $twentyFourHoursAgo = now()->subHours(24);

    $notificationIds = Notification::where('created_at', '<', $twentyFourHoursAgo)->pluck('id');

    if ($notificationIds->isNotEmpty()) {
        NotificationRecipient::whereIn('notification_id', $notificationIds)->delete();
        Notification::whereIn('id', $notificationIds)->delete();
        Log::info('[Scheduler] Pruned '.$notificationIds->count().' notifications older than 24 hours.');
    }
})->hourly();

// Check for overdue installments daily
Schedule::command('installments:check-overdue')->dailyAt('08:00');

// 💾 Automated Daily System & Database Backup
Schedule::command('backup:run --only-db')->dailyAt('02:00')->timezone('Asia/Riyadh');
Schedule::command('backup:clean')->dailyAt('02:30')->timezone('Asia/Riyadh');
