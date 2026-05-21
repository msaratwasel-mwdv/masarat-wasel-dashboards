<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

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

