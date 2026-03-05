<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\Guardian;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class BusLocationController extends Controller
{
    use \App\Traits\HasLocation;

    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * تحديث موقع الباص + التحقق من اقتراب البيت
     * POST /api/bus/{bus}/location
     */
    public function update(Request $request, Bus $bus)
    {
        $request->validate([
            'latitude'  => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $bus->update([
            'current_latitude' => $request->latitude,
            'current_longitude' => $request->longitude,
            'last_location_update' => now(),
        ]);

        // التحقق من اقتراب الباص من بيوت الطلاب (فقط لو الباص في طريق العودة)
        if ($bus->trip_status === 'on_route') {
            $this->checkProximityToHomes($bus, $request->latitude, $request->longitude);
        }

        return response()->json([
            'message' => 'تم تحديث الموقع.',
            'location' => [
                'latitude' => $bus->current_latitude,
                'longitude' => $bus->current_longitude,
                'updated_at' => $bus->last_location_update,
            ],
        ]);
    }

    /**
     * حساب المسافة بين نقطتين بالمتر (Haversine Formula)
     */
    private function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // بالمتر

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * التحقق من اقتراب الباص من بيوت أولياء الأمور
     */
    private function checkProximityToHomes(Bus $bus, float $busLat, float $busLon): void
    {
        // جلب الطلاب المسجلين في الباص مع أولياء أمورهم
        $students = $bus->students()
            ->wherePivot('is_active', true)
            ->with('guardian')
            ->get();

        foreach ($students as $student) {
            $guardian = $student->guardian;

            if (! $guardian || ! $guardian->home_latitude || ! $guardian->home_longitude) {
                continue;
            }

            $distance = $this->calculateDistance(
                $busLat, $busLon,
                (float) $guardian->home_latitude, (float) $guardian->home_longitude
            );

            $alertDistance = $guardian->proximity_alert_distance ?? 1000;

            if ($distance <= $alertDistance) {
                // تجنب إرسال إشعار مكرر (كل 10 دقائق كحد أدنى)
                $cacheKey = "proximity_alert_{$bus->id}_{$guardian->id}";
                if (cache()->has($cacheKey)) {
                    continue;
                }

                $distanceText = $this->formatDistance($distance);

                $this->notificationService->notifyStudentGuardian(
                    studentId: $student->id,
                    type: 'bus_proximity',
                    title: 'الباص يقترب',
                    message: "الباص {$bus->bus_number} على بعد {$distanceText} تقريباً من منزلكم.",
                    data: [
                        'bus_id' => $bus->id,
                        'student_id' => $student->id,
                        'distance_meters' => round($distance),
                        'bus_latitude' => $busLat,
                        'bus_longitude' => $busLon,
                    ]
                );

                // منع الإشعار المكرر لمدة 10 دقائق
                cache()->put($cacheKey, true, now()->addMinutes(10));
            }
        }
    }
}
