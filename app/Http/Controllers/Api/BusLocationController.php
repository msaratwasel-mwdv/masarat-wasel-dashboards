<?php

namespace App\Http\Controllers\Api;

use App\Events\BusLocationUpdated;
use App\Events\DriverLocationUpdated;
use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Services\GoogleMapsService;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class BusLocationController extends Controller
{
    use \App\Traits\HasLocation;

    protected NotificationService $notificationService;

    protected GoogleMapsService $googleMapsService;

    public function __construct(NotificationService $notificationService, GoogleMapsService $googleMapsService)
    {
        $this->notificationService = $notificationService;
        $this->googleMapsService = $googleMapsService;
    }

    /**
     * تحديث موقع الباص + التحقق من اقتراب البيت
     * POST /api/bus/{bus}/location
     */
    public function update(Request $request, Bus $bus)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'heading' => 'nullable|numeric',
        ]);

        $heading = $request->input('heading', 0);

        $targetLat = null;
        $targetLng = null;

        $updateData = [
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'last_location_update' => now(),
        ];

        $tLat = $request->input('target_lat');
        $tLng = $request->input('target_lng');

        // Check if target is stale (i.e., matches a student who already boarded/dropped/absent/excused)
        $isStaleTarget = false;
        if ($tLat !== null && $tLng !== null) {
            $today = now()->startOfDay();
            $processedCoords = cache()->remember("bus_{$bus->id}_stale_coords", 15, function () use ($bus, $today) {
                $trip = \App\Models\Trip::where('bus_id', $bus->id)
                    ->whereDate('trip_date', $today)
                    ->whereIn('status', ['in_progress', 'started'])
                    ->first();

                if (! $trip) {
                    return [];
                }

                $students = \App\Models\Student::where(function ($q) use ($bus) {
                    $q->where('forth_bus_id', $bus->id)
                        ->orWhere('back_bus_id', $bus->id);
                })
                    ->whereHas('tripAttendances', function ($q) use ($trip) {
                        $q->where('trip_id', $trip->id)
                            ->whereIn('status', ['boarded', 'dropped', 'absent', 'excused']);
                    })
                    ->get(['latitude', 'longitude', 'forth_latitude', 'forth_longitude', 'back_latitude', 'back_longitude']);

                $list = [];
                foreach ($students as $student) {
                    if ($student->latitude && $student->longitude) {
                        $list[] = [(float) $student->latitude, (float) $student->longitude];
                    }
                    if ($student->forth_latitude && $student->forth_longitude) {
                        $list[] = [(float) $student->forth_latitude, (float) $student->forth_longitude];
                    }
                    if ($student->back_latitude && $student->back_longitude) {
                        $list[] = [(float) $student->back_latitude, (float) $student->back_longitude];
                    }
                }

                return $list;
            });

            foreach ($processedCoords as $coord) {
                $latDiff = abs((float) $coord[0] - (float) $tLat);
                $lngDiff = abs((float) $coord[1] - (float) $tLng);
                if ($latDiff < 0.00015 && $lngDiff < 0.00015) {
                    $isStaleTarget = true;
                    break;
                }
            }
        }

        if ($isStaleTarget) {
            \Log::info("Ignoring stale target coordinates from driver location update for bus {$bus->id}. Coords: {$tLat}, {$tLng}");
            $bus->setAttribute('target_latitude', null);
            $bus->setAttribute('target_longitude', null);
            $updateData['target_latitude'] = $bus->target_latitude;
            $updateData['target_longitude'] = $bus->target_longitude;
            $targetLat = $bus->target_latitude;
            $targetLng = $bus->target_longitude;
        } else {
            // Cache and manage active target coordinates
            if ($request->has('target_lat')) {
                if ($tLat !== null) {
                    cache()->put('bus_target_lat_'.$bus->id, (float) $tLat, now()->addMinutes(10));
                    $updateData['target_latitude'] = (float) $tLat;
                    $targetLat = (float) $tLat;
                } else {
                    $updateData['target_latitude'] = null;
                    $targetLat = null;
                }
            } else {
                $targetLat = $bus->target_latitude;
            }

            if ($request->has('target_lng')) {
                if ($tLng !== null) {
                    cache()->put('bus_target_lng_'.$bus->id, (float) $tLng, now()->addMinutes(10));
                    $updateData['target_longitude'] = (float) $tLng;
                    $targetLng = (float) $tLng;
                } else {
                    $updateData['target_longitude'] = null;
                    $targetLng = null;
                }
            } else {
                $targetLng = $bus->target_longitude;
            }
        }

        \Log::debug("📡 [DRIVER] Received location update for Bus {$bus->id}", [
            'lat' => $request->latitude,
            'lng' => $request->longitude,
            'heading' => $heading,
            'target_lat' => $targetLat,
            'target_lng' => $targetLng,
        ]);

        // حماية: السائق المسجل فقط هو من يمكنه تحديث موقع الباص
        if (! $bus->hasCrewMember($request->user()->id)) {
            return response()->json(['message' => 'غير مصرح لك بتحديث موقع هذا الباص.'], 403);
        }

        // حساب السرعة الحقيقية بناءً على المسافة والزمن
        $speedKmh = 0;
        if ($bus->latitude && $bus->longitude && $bus->last_location_update) {
            $distance = $this->calculateDistance((float) $bus->latitude, (float) $bus->longitude, (float) $request->latitude, (float) $request->longitude);
            $timeDiff = $bus->last_location_update->diffInSeconds(now());
            // حساب السرعة إذا كان الفارق أقل من 10 دقائق لتجنب القفزات
            if ($timeDiff > 0 && $timeDiff < 600) {
                $speedKmh = ($distance / 1000) / ($timeDiff / 3600);
            }
        }
        // يمكن حفظ السرعة والاتجاه في الكاش لاستخدامها في واجهة المستخدم
        cache()->put('bus_speed_'.$bus->id, min(round($speedKmh, 1), 120), now()->addMinutes(5));
        cache()->put('bus_heading_'.$bus->id, $heading, now()->addMinutes(5));

        $bus->update($updateData);

        // 🔔 بث الموقع فورياً لجميع المتابعين (تطبيق السائق، المشرف، ولي الأمر)
        try {
            // تجميع المسافة المقطوعة الحقيقية للرحلة بناء على إحداثيات GPS (أكثر من 5 أمتار لتفادي اهتزاز GPS الثابت)
            if (isset($distance) && $distance > 5 && $distance < 5000) {
                $today = now()->startOfDay();
                $activeTrip = \App\Models\Trip::where('bus_id', $bus->id)->whereDate('trip_date', $today)->where('status', 'in_progress')->first();
                if ($activeTrip) {
                    $activeTrip->increment('actual_distance_km', round($distance / 1000, 3));
                }
            }

            $onBoardCount = (int) cache()->remember("bus_{$bus->id}_onboard_count", 15, function () use ($bus) {
                $today = now()->startOfDay();
                $trip = \App\Models\Trip::where('bus_id', $bus->id)->whereDate('trip_date', $today)->where('status', 'in_progress')->first();

                return $trip ? \App\Models\TripAttendance::where('trip_id', $trip->id)->where('status', 'boarded')->count() : 0;
            });

            // الحدث القديم للتوافق
            broadcast(new BusLocationUpdated($bus, (float) $request->latitude, (float) $request->longitude, (float) $heading, $onBoardCount, $targetLat, $targetLng));

            // الحدث الجديد للتتبع اللحظي الفوري
            broadcast(new DriverLocationUpdated($bus, (float) $request->latitude, (float) $request->longitude, (float) $heading, null, $targetLat, $targetLng));

            \Log::debug("✅ [DRIVER] Instant Broadcast Successful for Bus {$bus->id}");

        } catch (\Exception $e) {
            report($e);
            \Illuminate\Support\Facades\Log::error('Location broadcast error: '.$e->getMessage());
        }

        // التحقق من اقتراب الباص من بيوت الطلاب في الخلفية دون تعطيل مسار الـ GPS
        if (in_array($bus->trip_status, ['on_route', 'to_school', 'to_home'])) {
            $proximityThrottleKey = "bus_proximity_dispatch_{$bus->id}";
            if (! cache()->has($proximityThrottleKey)) {
                cache()->put($proximityThrottleKey, true, now()->addSeconds(30));
                \App\Jobs\CheckBusProximityJob::dispatch($bus->id, (float) $request->latitude, (float) $request->longitude);
            }
        }

        return response()->json([
            'message' => 'تم تحديث الموقع.',
            'location' => [
                'latitude' => $bus->latitude,
                'longitude' => $bus->longitude,
                'updated_at' => $bus->last_location_update,
            ],
        ]);
    }

    /**
     * جلب موقع الحافلة الحالي
     * GET /api/bus/{bus}/location
     */
    public function show(Request $request, Bus $bus)
    {
        // التحقق من الصلاحية: السائق أو المشرف أو ولي أمر أحد الطلاب في الباص أو مسؤول المدرسة
        $user = $request->user();

        $isCrew = $bus->hasCrewMember($user->id);
        $isGuardian = false;
        $isSchoolStaff = false;

        if (! $isCrew) {
            // التحقق من ولي الأمر
            $isGuardian = \App\Models\Student::whereHas('guardians', fn ($q) => $q->where('users.id', $user->id))
                ->where(function ($q) use ($bus) {
                    $q->where('forth_bus_id', $bus->id)
                        ->orWhere('back_bus_id', $bus->id);
                })->exists();

            // التحقق من طاقم المدرسة (المشرف الميداني أو مدير المدرسة)
            if (! $isGuardian) {
                $userSchoolId = $user->getSchoolIdEfficient();
                if ($userSchoolId && $userSchoolId == $bus->school_id) {
                    $isSchoolStaff = $user->hasRole('field_supervisor') || $user->hasRole('school_admin');
                }
            }
        }

        if (! $isCrew && ! $isGuardian && ! $isSchoolStaff) {
            if ($user->hasRole('admin') || $user->hasRole('field_supervisor')) {
                $isSchoolStaff = true;
            } else {
                return response()->json(['message' => 'غير مصرح لك بمتابعة هذا الباص.'], 403);
            }
        }

        // Fetch Driver Info
        $driver = $bus->driver?->user;
        $activeTrip = $bus->activeTrip;

        // Calculate Students on Board
        $studentsOnBoard = \App\Models\TripAttendance::whereHas('trip', function ($q) use ($bus) {
            $q->where('bus_id', $bus->id)->whereDate('trip_date', today())->where('status', 'in_progress');
        })->where('status', 'boarded')->count();

        // Per-student boarding status for this bus
        $guardianStudents = [];
        if ($isGuardian) {
            $guardianStudentIds = \App\Models\Student::whereHas('guardians', fn ($q) => $q->where('users.id', $user->id))->pluck('id');
            foreach ($guardianStudentIds as $sid) {
                $lastAttendance = \App\Models\TripAttendance::where('student_id', $sid)
                    ->whereHas('trip', fn ($q) => $q->where('bus_id', $bus->id)->whereDate('trip_date', today()))
                    ->latest()
                    ->first();

                $status = 'atHome';
                if ($lastAttendance) {
                    if ($lastAttendance->status === 'boarded') {
                        $status = 'onBus';
                    } elseif ($lastAttendance->status === 'dropped') {
                        $status = ($lastAttendance->trip?->type === 'forth') ? 'atSchool' : 'atHome';
                    }
                }
                $guardianStudents[] = ['student_id' => $sid, 'status' => $status];
            }
        }

        return response()->json([
            'bus_id' => $bus->id,
            'latitude' => $bus->latitude ? (float) $bus->latitude : null,
            'longitude' => $bus->longitude ? (float) $bus->longitude : null,
            'heading' => (float) cache()->get('bus_heading_'.$bus->id, 0),
            'target_lat' => $bus->target_latitude,
            'target_lng' => $bus->target_longitude,
            'trip_status' => $bus->trip_status,
            'trip_type' => $activeTrip ? $activeTrip->type : null,
            'departure_time' => $activeTrip ? $activeTrip->departure_time?->toIso8601String() : null,
            'last_update' => $bus->last_location_update ? $bus->last_location_update->toIso8601String() : null,
            'bus_number' => $bus->bus_number,
            'plate_number' => $bus->plate_number,
            'speed_kmh' => in_array($bus->trip_status, ['on_route', 'to_school', 'to_home']) ? cache()->get('bus_speed_'.$bus->id, 0) : 0,
            'eta_minutes' => cache()->get('bus_eta_'.$bus->id),
            'students_on_board' => $studentsOnBoard,
            'student_statuses' => $guardianStudents,
            'driver' => $driver ? [
                'id' => $driver->id,
                'name' => $driver->name,
                'phone' => $driver->phone,
                'image_url' => $driver->image_url ? url($driver->image_url) : 'https://i.pravatar.cc/150?u='.$driver->id,
            ] : null,
            'supervisor' => $bus->supervisor ? [
                'id' => $bus->supervisor->id,
                'name' => $bus->supervisor->name,
                'phone' => $bus->supervisor->phone,
                'image_url' => $bus->supervisor->image_url ? url($bus->supervisor->image_url) : 'https://i.pravatar.cc/150?u='.$bus->supervisor->id,
            ] : null,
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
        // جلب الطلاب المسجلين في الباص
        $students = \App\Models\Student::where('is_active', true)
            ->where(function ($q) use ($bus) {
                $q->where('forth_bus_id', $bus->id)
                    ->orWhere('back_bus_id', $bus->id);
            })
            ->with('guardians')
            ->get();

        foreach ($students as $student) {
            $guardian = $student->guardians->first();

            if (! $guardian || ! $guardian->latitude || ! $guardian->longitude) {
                continue;
            }

            $distance = $this->calculateDistance(
                $busLat, $busLon,
                (float) $guardian->latitude, (float) $guardian->longitude
            );

            $alertDistance = $guardian->proximity_alert_distance ?? 2000;

            if ($distance <= $alertDistance) {
                // تجنب إرسال إشعار مكرر (كل 10 دقائق كحد أدنى)
                $cacheKey = "proximity_alert_{$bus->id}_{$guardian->id}";
                if (cache()->has($cacheKey)) {
                    continue;
                }

                $distanceText = $this->formatDistance($distance);

                // تحديد اتجاه الرحلة بناءً على الرحلة النشطة الحالية
                $activeTrip = \App\Models\Trip::where('bus_id', $bus->id)
                    ->whereDate('trip_date', today())
                    ->where('status', 'in_progress')
                    ->first();

                $direction = ($activeTrip?->type === 'forth') ? 'to_school' : 'to_home';

                // SCRUM-85 & SCRUM-88: التنبيه عند اقتراب الحافلة (مسافة 2 كم + زمن تقديري دقيقتين)
                $titleKey = $direction === 'to_school' ? 'notifications.bus_proximity_to_school_title' : 'notifications.bus_proximity_to_home_title';
                $messageKey = $direction === 'to_school' ? 'notifications.bus_proximity_to_school_message' : 'notifications.bus_proximity_to_home_message';

                $studentNameEn = ! empty($student->full_name_en) ? $student->full_name_en : $student->full_name;

                foreach ($student->guardians as $guardian) {
                    $this->notificationService->sendTranslatedToUser(
                        userId: $guardian->id,
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
                            'bus_latitude' => $busLat,
                            'bus_longitude' => $busLon,
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

                // منع الإشعار المكرر لمدة 10 دقائق
                cache()->put($cacheKey, true, now()->addMinutes(10));
            }
        }
    }
}
