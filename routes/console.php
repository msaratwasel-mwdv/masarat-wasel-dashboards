<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Schedule::command('trips:create-daily')->dailyAt('22:00')->timezone('Asia/Riyadh');

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('model:prune')->daily();

// Auto-create daily (forth & back) trips for all buses with routes at 01:00 AM each day
Schedule::command('trips:create-daily')->dailyAt('01:00');

// Cleanup trip verification videos older than 30 days
Schedule::command('trips:cleanup-videos')->dailyAt('03:00');
