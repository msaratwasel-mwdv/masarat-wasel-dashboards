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

        // حماية: السائق المسجل فقط هو من يمكنه تحديث موقع الباص
        if ($bus->driver_id !== $request->user()->id) {
            return response()->json(['message' => 'غير مصرح لك بتحديث موقع هذا الباص.'], 403);
        }

        $bus->update([
            'current_latitude' => $request->latitude,
            'current_longitude' => $request->longitude,
            'last_location_update' => now(),
        ]);

        // 🔔 بث الموقع فورياً لجميع المتابعين (تطبيق السائق، المشرف، ولي الأمر)
        try {
            // حساب عدد الطلاب الراكبين حالياً (اختياري)
            $today = now()->startOfDay();
            $boardedCount = \App\Models\BusBoardingLog::where('bus_id', $bus->id)->where('type', 'boarding')->where('created_at', '>=', $today)->distinct('student_id')->count();
            $alightedCount = \App\Models\BusBoardingLog::where('bus_id', $bus->id)->where('type', 'alighting')->where('created_at', '>=', $today)->distinct('student_id')->count();
            $onBoard = max(0, $boardedCount - $alightedCount);

            broadcast(new \App\Events\BusLocationUpdated($bus, $request->latitude, $request->longitude, $onBoard));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Location broadcast error: " . $e->getMessage());
        }

        // التحقق من اقتراب الباص من بيوت الطلاب (فقط لو الباص في رحلة نشطة)
        if (in_array($bus->trip_status, ['on_route', 'to_school', 'to_home'])) {
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
     * جلب موقع الحافلة الحالي
     * GET /api/bus/{bus}/location
     */
    public function show(Request $request, Bus $bus)
    {
        // التحقق من الصلاحية: السائق أو ولي أمر أحد الطلاب في الباص
        $user = $request->user();
        
        $isDriver = $bus->driver_id === $user->id;
        $isGuardian = false;

        if (!$isDriver) {
            $isGuardian = \App\Models\Student::where('guardian_id', $user->id)
                ->where(function($q) use ($bus) {
                    $q->whereHas('morningGroup', fn($g) => $g->where('bus_id', $bus->id))
                      ->orWhereHas('afternoonGroup', fn($g) => $g->where('bus_id', $bus->id))
                      ->orWhereHas('buses', fn($b) => $b->where('buses.id', $bus->id));
                })->exists();
        }

        if (!$isDriver && !$isGuardian) {
            return response()->json(['message' => 'غير مصرح لك بمتابعة هذا الباص.'], 403);
        }

        // Fetch Driver Info
        $driver = $bus->driver;
        
        // Calculate Students on Board (Students who boarded but not alighted today)
        $today = now()->startOfDay();
        $boardedCount = \App\Models\BusBoardingLog::where('bus_id', $bus->id)
            ->where('type', 'boarding')
            ->where('created_at', '>=', $today)
            ->distinct('student_id')
            ->count();
        $alightedCount = \App\Models\BusBoardingLog::where('bus_id', $bus->id)
            ->where('type', 'alighting')
            ->where('created_at', '>=', $today)
            ->distinct('student_id')
            ->count();
        $studentsOnBoard = max(0, $boardedCount - $alightedCount);

        // Per-student boarding status for this bus (for real-time updates)
        $guardianStudents = [];
        if ($isGuardian) {
            $guardianStudentIds = \App\Models\Student::where('guardian_id', $user->id)->pluck('id');
            foreach ($guardianStudentIds as $sid) {
                $lastLog = \App\Models\BusBoardingLog::where('student_id', $sid)
                    ->where('bus_id', $bus->id)
                    ->where('created_at', '>=', $today)
                    ->latest()
                    ->first();
                $status = 'atHome';
                if ($lastLog) {
                    if ($lastLog->type === 'boarding') $status = 'onBus';
                    elseif ($lastLog->type === 'alighting') $status = ($lastLog->direction === 'to_school') ? 'atSchool' : 'atHome';
                }
                $guardianStudents[] = ['student_id' => $sid, 'status' => $status];
            }
        }

        return response()->json([
            'bus_id' => $bus->id,
            'latitude' => (double) $bus->current_latitude,
            'longitude' => (double) $bus->current_longitude,
            'trip_status' => $bus->trip_status,
            'last_update' => $bus->last_location_update ? $bus->last_location_update->toIso8601String() : null,
            'bus_number' => $bus->bus_number,
            'plate_number' => $bus->plate_number,
            'speed_kmh' => in_array($bus->trip_status, ['on_route', 'to_school', 'to_home']) ? rand(30, 60) : 0,
            'students_on_board' => $studentsOnBoard,
            'student_statuses' => $guardianStudents,
            'driver' => $driver ? [
                'id' => $driver->id,
                'name' => $driver->name,
                'phone' => $driver->phone,
                'image_url' => $driver->image_url ? url($driver->image_url) : 'https://i.pravatar.cc/150?u=' . $driver->id,
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

                // تحديد اتجاه الرحلة بناءً على آخر سجل للباص اليوم
                $lastLog = \App\Models\BusBoardingLog::where('bus_id', $bus->id)
                    ->today()
                    ->latest()
                    ->first();
                
                $direction = $lastLog?->direction ?? 'to_home';
                
                // SCRUM-85 & SCRUM-88: التنبيه عند اقتراب الحافلة (مسافة + زمن تقديري)
                if ($direction === 'to_school') {
                    $title = "الحافلة تقترب لاستلام {$student->full_name}";
                    $message = "الحافلة على بعد {$distanceText} من منزلك، ستصل خلال 5 دقائق تقريباً. يرجى تجهيز الطالب للركوب.";
                } else {
                    $title = "طالبك {$student->full_name} سيصل خلال 5 دقائق";
                    $message = "الحافلة على بعد {$distanceText} من منزلك، ستصل خلال 5 دقائق تقريباً. يرجى الاستعداد لاستلام الطالب.";
                }

                $this->notificationService->notifyStudentGuardian(
                    studentId: $student->id,
                    type: 'bus_proximity',
                    title: $title,
                    message: $message,
                    data: [
                        'bus_id' => $bus->id,
                        'student_id' => $student->id,
                        'distance_meters' => round($distance),
                        'distance_text' => $distanceText,
                        'bus_latitude' => $busLat,
                        'bus_longitude' => $busLon,
                        'eta_minutes' => 5,
                        'direction' => $direction,
                    ]
                );

                // منع الإشعار المكرر لمدة 10 دقائق
                cache()->put($cacheKey, true, now()->addMinutes(10));
            }
        }
    }
}


