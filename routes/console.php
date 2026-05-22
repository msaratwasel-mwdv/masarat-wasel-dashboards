<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use Illuminate\Support\Facades\Log;

Schedule::command('trips:create-daily')->dailyAt('22:00')->timezone('Asia/Riyadh');

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('model:prune')->daily();
Schedule::command('telescope:prune --hours=24')->daily();

// Auto-create daily (forth & back) trips for all buses with routes at 01:00 AM each day
Schedule::command('trips:create-daily')->dailyAt('01:00');

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
        Log::info('[Scheduler] Pruned ' . $notificationIds->count() . ' notifications older than 24 hours.');
    }
})->hourly();


