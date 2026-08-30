<?php

namespace App\Traits;

trait HasLocation
{
    /**
     * حساب المسافة بين نقطتين بالمتر (Haversine Formula)
     */
    public function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
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
     * تنسيق المسافة نصياً (متر أو كم)
     */
    public function formatDistance(float $distanceMeters): string
    {
        return $distanceMeters < 1000
            ? round($distanceMeters).' متر'
            : round($distanceMeters / 1000, 1).' كم';
    }
}
