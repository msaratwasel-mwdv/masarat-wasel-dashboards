<?php

namespace App\Jobs;

use App\Models\Bus;
use App\Models\Student;
use App\Models\Trip;
use App\Services\NotificationService;
use App\Traits\HasLocation;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CheckBusProximityJob implements ShouldQueue
{
    use Dispatchable, HasLocation, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 2;

    /**
     * Timeout for the job in seconds.
     */
    public int $timeout = 30;

    public function __construct(
        public int $busId,
        public float $busLat,
        public float $busLon
    ) {}

    /**
     * Execute the job.
     */
    public function handle(NotificationService $notificationService): void
    {
        $bus = Bus::find($this->busId);
        if (! $bus) {
            return;
        }

        if (! in_array($bus->trip_status, ['on_route', 'to_school', 'to_home'])) {
            return;
        }

        $students = Student::where('is_active', true)
            ->where(function ($q) use ($bus) {
                $q->where('forth_bus_id', $bus->id)
                    ->orWhere('back_bus_id', $bus->id);
            })
            ->with('guardians')
            ->get();

        if ($students->isEmpty()) {
            return;
        }

        $activeTrip = Trip::where('bus_id', $bus->id)
            ->whereDate('trip_date', Carbon::today())
            ->where('status', 'in_progress')
            ->first();

        $direction = ($activeTrip?->type === 'forth') ? 'to_school' : 'to_home';
        $titleKey = $direction === 'to_school'
            ? 'notifications.bus_proximity_to_school_title'
            : 'notifications.bus_proximity_to_home_title';
        $messageKey = $direction === 'to_school'
            ? 'notifications.bus_proximity_to_school_message'
            : 'notifications.bus_proximity_to_home_message';

        foreach ($students as $student) {
            $guardian = $student->guardians->first();
            if (! $guardian || ! $guardian->latitude || ! $guardian->longitude) {
                continue;
            }

            $distance = $this->calculateDistance(
                $this->busLat,
                $this->busLon,
                (float) $guardian->latitude,
                (float) $guardian->longitude
            );

            $alertDistance = $guardian->proximity_alert_distance ?? 2000;

            if ($distance <= $alertDistance) {
                $cacheKey = "proximity_alert_{$bus->id}_{$guardian->id}";
                if (cache()->has($cacheKey)) {
                    continue;
                }

                $distanceText = $this->formatDistance($distance);
                $studentNameEn = ! empty($student->full_name_en) ? $student->full_name_en : $student->full_name;

                foreach ($student->guardians as $g) {
                    $notificationService->sendTranslatedToUser(
                        userId: $g->id,
                        type: 'bus_proximity',
                        titleKey: $titleKey,
                        messageKey: $messageKey,
                        translationParams: [
                            'student' => $student->full_name,
                            'distance' => $distanceText,
                        ],
                        data: [
                            'bus_id' => $bus->id,
                            'student_id' => $student->id,
                            'distance_meters' => round($distance),
                            'distance_text' => $distanceText,
                            'bus_latitude' => $this->busLat,
                            'bus_longitude' => $this->busLon,
                            'eta_minutes' => 2,
                            'direction' => $direction,
                            'category' => 'tracking',
                            'target_screen' => 'map_page',
                        ],
                        translationParamsEn: [
                            'student' => $studentNameEn,
                            'distance' => $distanceText,
                        ]
                    );
                }

                cache()->put($cacheKey, true, now()->addMinutes(10));
            }
        }
    }

    /**
     * Calculate distance between two coordinates in meters (Haversine).
     */
    private function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
