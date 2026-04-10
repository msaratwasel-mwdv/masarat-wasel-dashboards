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
    protected $signature = 'trips:create-daily';

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
        $this->info('Starting daily trip creation...');
        $tripService->autoCreateDailyTrips();
        $this->info('Daily trips created successfully!');
    }
}


