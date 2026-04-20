<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CleanupTripVideos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'trips:cleanup-videos';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete verification videos older than 30 days';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = 30;
        $expiryDate = now()->subDays($days);

        $trips = \App\Models\Trip::where('created_at', '<', $expiryDate)
            ->whereNotNull('video_path')
            ->get();

        $count = 0;
        foreach ($trips as $trip) {
            if (\Illuminate\Support\Facades\Storage::disk('public')->exists($trip->video_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($trip->video_path);
                $trip->update(['video_path' => null]);
                $count++;
            }
        }

        $this->info("Deleted {$count} verification videos older than {$days} days.");
    }
}
