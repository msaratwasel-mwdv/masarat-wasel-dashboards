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

    /**
     * فرز الطلاب حسب التسلسل الجغرافي الأقرب (Nearest-Neighbor Algorithm)
     * مع مراعاة أولوية الترتيب اليدوي في حال قامت إدارة المدرسة بتعيينه مسبقاً.
     *
     * في رحلة الذهاب (صباحاً): تبدأ الحافلة من موقعها الفعلي (أو المدرسة كبديل)، وتتوجه إلى أقرب طالب للحافلة،
     * ثم الأقرب فالأقرب حتى آخر طالب، لتصل في النهاية إلى المدرسة.
     *
     * في رحلة العودة (مساءً): تنطلق الحافلة من المدرسة، وتبدأ بإنزال أقرب طالب للمدرسة، ثم الأقرب تالياً...
     *
     * @param  \Illuminate\Support\Collection|array  $students
     * @param  string  $tripType  'morning'|'afternoon'|'forth'|'back'
     * @return \Illuminate\Support\Collection
     */
    public function sortStudentsByOptimalSequence(
        $students,
        float $schoolLat,
        float $schoolLng,
        string $tripType,
        ?float $busLat = null,
        ?float $busLng = null
    ) {
        $collection = collect($students);
        $isMorning = in_array($tripType, ['morning', 'forth']);
        $orderField = $isMorning ? 'forth_stop_order' : 'back_stop_order';

        // 1. استخراج الإحداثيات مع فحص إحداثيات ولي الأمر كخيار احتياطي
        $extractCoords = function ($student) use ($isMorning) {
            $parent = null;
            if (is_object($student)) {
                if (method_exists($student, 'relationLoaded') && $student->relationLoaded('guardian')) {
                    $parent = $student->guardian?->first(fn ($g) => ! empty($g->latitude) && ! empty($g->longitude))
                        ?? $student->guardian?->first();
                } elseif (isset($student->guardian) && is_iterable($student->guardian)) {
                    $parent = collect($student->guardian)->first(fn ($g) => ! empty($g->latitude) && ! empty($g->longitude))
                        ?? collect($student->guardian)->first();
                }
            }

            $lat = $isMorning
                ? ($student->forth_latitude ?? $student->latitude ?? $parent?->latitude ?? null)
                : ($student->back_latitude ?? $student->latitude ?? $parent?->latitude ?? null);
            $lng = $isMorning
                ? ($student->forth_longitude ?? $student->longitude ?? $parent?->longitude ?? null)
                : ($student->back_longitude ?? $student->longitude ?? $parent?->longitude ?? null);

            if (! empty($lat) && ! empty($lng) && (float) $lat != 0.0 && (float) $lng != 0.0) {
                return [(float) $lat, (float) $lng];
            }

            return [null, null];
        };

        // 2. فحص الترتيب اليدوي المعتمد من الإدارة:
        // الترتيب إما أن يكون كاملاً يدوياً لجميع الطلاب، أو كاملاً عبر الخرائط بالأقرب (لا يوجد نصف يدوي ونصف تلقائي)
        $allHaveManualOrder = $collection->isNotEmpty() && $collection->every(function ($student) use ($orderField) {
            $val = data_get($student, $orderField, 0);

            return is_numeric($val) && (int) $val > 0;
        });

        if ($allHaveManualOrder) {
            return $collection->sortBy(function ($student) use ($orderField) {
                return (int) data_get($student, $orderField, 0);
            })->values();
        }

        // 3. الترتيب التلقائي الذكي بالأقرب (Nearest-Neighbor)
        // تحديد نقطة انطلاق الباص
        if ($isMorning) {
            // في الصباح: الانطلاق من موقع الحافلة الحالي (أو المدرسة كبديل)
            $hasBusLocation = (! empty($busLat) && ! empty($busLng) && (float) $busLat != 0.0 && (float) $busLng != 0.0);
            $startLat = $hasBusLocation ? (float) $busLat : $schoolLat;
            $startLng = $hasBusLocation ? (float) $busLng : $schoolLng;
        } else {
            // في العودة ظهراً: الانطلاق من المدرسة (مكان ركوب الطلاب)
            $startLat = $schoolLat;
            $startLng = $schoolLng;
        }

        return $this->runNearestNeighborSort($collection, $startLat, $startLng, $extractCoords);
    }

    /**
     * تنفيذ خوارزمية الجوار الأقرب الصافية انطلاقاً من إحداثيات محددة
     */
    protected function runNearestNeighborSort($students, float $startLat, float $startLng, \Closure $extractCoords): \Illuminate\Support\Collection
    {
        $valid = [];
        $invalid = [];

        foreach ($students as $student) {
            [$lat, $lng] = $extractCoords($student);
            if ($lat !== null && $lng !== null) {
                $student->_geo_lat = $lat;
                $student->_geo_lng = $lng;
                $valid[] = $student;
            } else {
                $invalid[] = $student;
            }
        }

        if (count($valid) <= 1) {
            return collect(array_merge($valid, $invalid));
        }

        $ordered = [];
        $remaining = $valid;
        $currentLat = $startLat;
        $currentLng = $startLng;

        while (! empty($remaining)) {
            $bestIdx = 0;
            $bestDist = PHP_FLOAT_MAX;

            foreach ($remaining as $idx => $cand) {
                $dist = $this->calculateDistance($currentLat, $currentLng, $cand->_geo_lat, $cand->_geo_lng);
                if ($dist < $bestDist) {
                    $bestDist = $dist;
                    $bestIdx = $idx;
                }
            }

            $chosen = $remaining[$bestIdx];
            $ordered[] = $chosen;
            $currentLat = $chosen->_geo_lat;
            $currentLng = $chosen->_geo_lng;

            unset($remaining[$bestIdx]);
            $remaining = array_values($remaining);
        }

        return collect(array_merge($ordered, $invalid));
    }
}
