<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Trip;
use App\Models\TripAttendance;
use App\Services\NotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AutoCloseAwaitingVideoTrips extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'trips:auto-close-awaiting-video';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Auto-close trips in awaiting_video status that have exceeded 30 minutes, and notify admins.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $expiryTime = now()->subMinutes(30);

        // Find trips that are in 'awaiting_video' state and haven't been updated for 30 minutes.
        /** @var \Illuminate\Database\Eloquent\Collection $trips */
        $trips = Trip::with(['bus'])
            ->where('status', 'awaiting_video')
            ->where('updated_at', '<=', $expiryTime)
            ->get();

        $count = 0;
        $notificationService = app(NotificationService::class);

        foreach ($trips as $trip) {
            DB::transaction(function () use ($trip) {
                // If it is a morning trip (forth), automatically drop any passengers who were boarded but not checked out.
                if ($trip->type === 'forth') {
                    TripAttendance::where('trip_id', $trip->id)
                        ->where('status', 'boarded')
                        ->update([
                            'status' => 'dropped',
                            'check_out_time' => now()
                        ]);
                }

                // Update trip to finished with video_check = false
                $trip->update([
                    'status' => 'finished',
                    'video_check' => false,
                    'video_path' => null,
                    'arrival_time' => $trip->arrival_time ?: now(),
                ]);

                // Update bus status to idle
                if ($trip->bus) {
                    $trip->bus->update(['trip_status' => 'idle']);
                }
            });

            // Broadcast status update
            try {
                if ($trip->bus) {
                    broadcast(new \App\Events\TripStatusUpdated($trip, $trip->bus, 'finished'));
                }
            } catch (\Exception $e) {
                Log::error("Broadcast error in auto-close command: " . $e->getMessage());
            }

            // Notify all company administrators that the driver failed to record the required video
            try {
                $busNumber = $trip->bus ? $trip->bus->bus_number : '—';
                $directionText = $trip->type === 'forth' ? 'ذهاب' : 'عودة';
                $directionTextEn = $trip->type === 'forth' ? 'Forth' : 'Back';

                $notificationService->notifyCompanyAdmins(
                    type: 'driver_compliance',
                    title: 'تنبيه: عدم توثيق رحلة بالفيديو',
                    message: "السائق لم يقم بتصوير فيديو التوثيق لرحلة الحافلة رقم {$busNumber} (نوع الرحلة: {$directionText}) بعد مرور 30 دقيقة من نزول الطلاب.",
                    data: [
                        'trip_id' => (string)$trip->id,
                        'bus_id' => (string)$trip->bus_id,
                        'category' => 'compliance_alert',
                    ],
                    titleEn: 'Compliance Alert: No Trip Video Verification',
                    messageEn: "The driver failed to record the verification video for bus {$busNumber} ({$directionTextEn} trip) within 30 minutes after arrival."
                );
            } catch (\Exception $e) {
                Log::error("FCM Admin notification error in auto-close command: " . $e->getMessage());
            }

            $count++;
        }

        if ($count > 0) {
            $this->info("Successfully auto-closed {$count} trips in awaiting_video status.");
        }
    }
}
