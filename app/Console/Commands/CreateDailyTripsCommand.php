<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CreateDailyTripsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'trips:create-daily 
                            {--date= : Target date for the trips (format: YYYY-MM-DD)} 
                            {--force : Force generation even on weekends (Friday/Saturday)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically create daily trips (forth/back) for buses with assigned routes';

    /**
     * Execute the console command.
     */
    public function handle(\App\Services\TripService $tripService)
    {
        $dateOption = $this->option('date');
        $force = (bool) $this->option('force');

        $targetDate = $dateOption
            ? \Carbon\Carbon::parse($dateOption)->startOfDay()
            : \Carbon\Carbon::today('Asia/Muscat');

        $this->info("Starting to generate daily trips for {$targetDate->toDateString()} ({$targetDate->englishDayOfWeek})...");

        $results = $tripService->autoCreateDailyTrips($targetDate, $force);

        if (isset($results['status']) && $results['status'] === 'skipped') {
            $reason = $results['reason_ar'] ?? $results['reason'] ?? 'Skipped';
            $this->warn("Skipped: {$reason}");

            return 0;
        }

        $this->info("Finished! Created: {$results['created']}, Skipped: {$results['skipped']}");

        return 0;
    }
}
