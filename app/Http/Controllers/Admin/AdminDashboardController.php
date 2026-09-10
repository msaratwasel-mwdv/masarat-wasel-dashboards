<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\School;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $stats = \Illuminate\Support\Facades\Cache::remember('admin_dashboard_stats', 300, function () {
            // --- 1. Bus Stats ---
            $busTotal = Bus::count();
            $busMaintenance = Bus::where('status', 'maintenance')->count();
            $busBooked = Bus::where('status', 'active')->has('driver')->count();
            $busAvailable = Bus::where('status', 'active')->doesntHave('driver')->count();

            // --- 2. Staff Stats — single query for all roles ---
            $roleCounts = \Illuminate\Support\Facades\DB::table('user_roles')
                ->join('roles', 'user_roles.role_id', '=', 'roles.id')
                ->whereIn('roles.name', ['driver', 'field_supervisor', 'assistant'])
                ->selectRaw('roles.name, COUNT(*) as total')
                ->groupBy('roles.name')
                ->pluck('total', 'name');

            $driverTotal = $roleCounts->get('driver', 0);
            $driverBooked = Bus::whereNotNull('driver_id')->distinct('driver_id')->count();
            $driverAvailable = max(0, $driverTotal - $driverBooked);

            $fieldSupervisorTotal = $roleCounts->get('field_supervisor', 0);
            $fieldSupervisorBooked = Bus::whereNotNull('field_supervisor_id')->distinct('field_supervisor_id')->count();
            $fieldSupervisorAvailable = max(0, $fieldSupervisorTotal - $fieldSupervisorBooked);

            $assistantTotal = $roleCounts->get('assistant', 0);
            $assistantBooked = Bus::whereNotNull('assistant_id')->distinct('assistant_id')->count();
            $assistantAvailable = max(0, $assistantTotal - $assistantBooked);

            return [
                'total_schools' => \App\Models\School::count(),
                'total_students' => \App\Models\Student::count(),
                'total_trips' => \App\Models\Trip::count(),
                'daily_trips_today' => [
                    'pending' => \App\Models\Trip::whereDate('trip_date', \Carbon\Carbon::today())->where('status', 'pending')->count(),
                    'ongoing' => \App\Models\Trip::whereDate('trip_date', \Carbon\Carbon::today())->whereIn('status', ['in_progress', 'ongoing'])->count(),
                    'completed' => \App\Models\Trip::whereDate('trip_date', \Carbon\Carbon::today())->whereIn('status', ['finished', 'completed'])->count(),
                ],

                // Buses Detailed
                'buses' => [
                    'total' => $busTotal,
                    'available' => $busAvailable,
                    'booked' => $busBooked,
                    'maintenance' => $busMaintenance,
                ],

                // Drivers Detailed
                'drivers' => [
                    'total' => $driverTotal,
                    'available' => $driverAvailable,
                    'booked' => $driverBooked,
                ],

                // Field Supervisors Detailed
                'field_supervisors' => [
                    'total' => $fieldSupervisorTotal,
                    'available' => $fieldSupervisorAvailable,
                    'booked' => $fieldSupervisorBooked,
                ],

                // Assistants Detailed
                'assistants' => [
                    'total' => $assistantTotal,
                    'available' => $assistantAvailable,
                    'booked' => $assistantBooked,
                ],
            ];
        });

        // --- 5. Trends & Charts (US-REP-002) ---
        $sevenDaysAgo = Carbon::now()->subDays(6)->startOfDay();

        // Trips Trend (Last 7 Days - Real Database Records)
        $tripsTrend = collect(range(0, 6))->map(function ($days) {
            $targetDate = Carbon::now()->subDays(6 - $days)->startOfDay();
            $count = \App\Models\Trip::whereDate('trip_date', $targetDate)->count();

            return [
                'date' => $targetDate->format('m/d'),
                'count' => $count,
            ];
        });

        // Fleet Distribution (for Pie Chart)
        $fleetDistribution = [
            ['name' => 'Active', 'value' => $stats['buses']['booked'], 'color' => '#22c55e'],
            ['name' => 'Available', 'value' => $stats['buses']['available'], 'color' => '#eab308'],
            ['name' => 'Maintenance', 'value' => $stats['buses']['maintenance'], 'color' => '#ef4444'],
        ];

        // --- 6. Recent Activities Feed ---
        $recentViolations = \App\Models\Violation::with('bus')->latest()->take(3)->get()->map(function ($item) {
            $busPlate = $item->bus ? $item->bus->plate_number : 'باص غير معرّف';

            return [
                'id' => $item->id,
                'type' => 'violation',
                'title' => 'مخالفة مرصودة',
                'description' => "{$busPlate}: {$item->description}",
                'time' => $item->created_at->diffForHumans(),
                'timestamp' => $item->created_at->timestamp,
                'status' => $item->status,
                'link' => route('admin.emergencies.index'),
            ];
        });

        // Fetch actual recent bus requests
        $recentRequests = \App\Models\BusRequest::with('school')->latest()->take(3)->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'type' => 'bus_request',
                'title' => 'طلب حافلة جديد',
                'description' => "مدرسة {$item->school->name}: طلب {$item->request_type} ({$item->seats} مقعد)",
                'time' => $item->created_at->diffForHumans(),
                'timestamp' => $item->created_at->timestamp,
                'status' => $item->status,
                'link' => route('admin.bus-requests.index'),
            ];
        });

        $recentActivities = $recentRequests->concat($recentViolations)
            ->sortByDesc('timestamp')
            ->values()
            ->take(5);

        // 7. منطق التنبيهات (US-ALT-001)
        $alerts = [];

        // أ. فحص الباصات النشطة بدون سائقين (Existing)
        $unassignedBuses = Bus::where('status', 'active')
            ->doesntHave('driver')
            ->get();

        foreach ($unassignedBuses as $bus) {
            $plate = $bus->plate_number ?? 'غير معروف';
            $alerts[] = [
                'type' => 'warning',
                'category' => 'bus', // Icon category
                'message' => "تحذير: الحافلة ({$plate}) نشطة ولكن لم يتم تعيين سائق لها!",
            ];
        }

        // ب. فحص انتهاء الرخص — via drivers extension table
        $expiringLicenses = \App\Models\Driver::with('user')
            ->whereDate('license_expiry_date', '<=', Carbon::now()->addDays(30))
            ->whereDate('license_expiry_date', '>=', Carbon::now())
            ->get();

        foreach ($expiringLicenses as $profile) {
            $expiryDate = Carbon::parse($profile->license_expiry_date);
            $daysLeft = (int) ceil(Carbon::now()->floatDiffInDays($expiryDate, false));
            $driverName = $profile->user
                ? ($profile->user->first_name_ar.' '.$profile->user->last_name_ar)
                : 'Unknown';
            $formattedDate = $expiryDate->format('Y-m-d');

            $alerts[] = [
                'type' => 'critical',
                'category' => 'driver',
                'message' => "تنبيه: رخصة السائق ({$driverName}) تنتهي بتاريخ {$formattedDate} (متبقي: {$daysLeft} يوم).",
            ];
        }

        // ج. فحص الرخص المنتهية فعلياً — via drivers extension table
        $expiredLicenses = \App\Models\Driver::with('user')
            ->whereDate('license_expiry_date', '<', Carbon::now())
            ->get();

        foreach ($expiredLicenses as $profile) {
            $expiryDate = Carbon::parse($profile->license_expiry_date);
            $driverName = $profile->user
                ? ($profile->user->first_name_ar.' '.$profile->user->last_name_ar)
                : 'Unknown';
            $formattedDate = $expiryDate->format('Y-m-d');

            $alerts[] = [
                'type' => 'critical',
                'category' => 'driver',
                'message' => "خطر: رخصة السائق ({$driverName}) منتهية منذ تاريخ {$formattedDate}!",
            ];
        }

        // 3. التتبع المباشر الحقيقي لأسطول الحافلات (Real Live Fleet Tracking)
        $liveBuses = Bus::with(['school:id,name,latitude,longitude', 'driver.user:id,first_name_ar,last_name_ar,first_name_en,last_name_en,phone', 'route:id,name'])
            ->get()
            ->map(fn ($bus) => $this->formatLiveTrackingBus($bus));

        $liveStats = [
            'total_buses' => $liveBuses->count(),
            'active_buses' => $liveBuses->where('status', 'active')->count(),
            'moving_buses' => $liveBuses->filter(fn ($b) => ($b['speed_kmh'] ?? 0) > 0 && ($b['is_moving'] ?? false))->count(),
            'total_students' => Student::where('is_active', true)->count(),
            'students_on_board' => $liveBuses->sum('students_on_board'),
        ];

        // 4. بيانات الفلترة ومعالم المدارس على الخريطة
        $filterSchools = School::select('id', 'name', 'latitude', 'longitude')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'lat' => $s->latitude ? (float) $s->latitude : null,
                'lng' => $s->longitude ? (float) $s->longitude : null,
            ]);

        $filterBuses = Bus::where('status', 'active')
            ->select('id', 'bus_number', 'plate_number', 'school_id')
            ->get();

        // التوافق العكسي لـ mapData
        $legacyMapData = $liveBuses->map(fn ($b) => [
            'id' => $b['id'],
            'code' => 'BUS-'.$b['bus_number'],
            'lat' => $b['latitude'],
            'lng' => $b['longitude'],
            'status' => $b['is_moving'] ? 'moving' : 'stopped',
            'speed' => ($b['speed_kmh'] ?? 0).' km/h',
            'school_id' => $b['school_id'],
        ]);

        // 8. Pending Subscriptions (NEW)
        $pendingSubscriptions = \App\Models\Subscription::with(['school.users', 'plan'])
            ->where('status', 'pending_approval')
            ->latest()
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'alerts' => $alerts,
            'mapData' => $legacyMapData,
            'liveBuses' => $liveBuses,
            'liveStats' => $liveStats,
            'filterSchools' => $filterSchools,
            'filterBuses' => $filterBuses,
            'tripsTrend' => $tripsTrend,
            'fleetDistribution' => $fleetDistribution,
            'recentActivities' => $recentActivities,
            'pendingSubscriptions' => $pendingSubscriptions,
        ]);
    }

    /**
     * API for Admin Real-time Tracking Data with School and Bus filtering.
     */
    public function trackingApi(Request $request)
    {
        $query = Bus::with(['school:id,name,latitude,longitude', 'driver.user:id,first_name_ar,last_name_ar,first_name_en,last_name_en,phone', 'route:id,name']);

        if ($request->filled('school_id') && $request->school_id !== 'all' && $request->school_id !== '') {
            $query->where('school_id', $request->school_id);
        }

        if ($request->filled('bus_id') && $request->bus_id !== 'all' && $request->bus_id !== '') {
            $query->where('id', $request->bus_id);
        }

        $buses = $query->get()->map(fn ($bus) => $this->formatLiveTrackingBus($bus));

        $studentsQuery = Student::where('is_active', true);
        if ($request->filled('school_id') && $request->school_id !== 'all' && $request->school_id !== '') {
            $studentsQuery->where('school_id', $request->school_id);
        }

        $stats = [
            'total_buses' => $buses->count(),
            'active_buses' => $buses->where('status', 'active')->count(),
            'moving_buses' => $buses->filter(fn ($b) => ($b['speed_kmh'] ?? 0) > 0 && ($b['is_moving'] ?? false))->count(),
            'total_students' => $studentsQuery->count(),
            'students_on_board' => $buses->sum('students_on_board'),
        ];

        return response()->json([
            'success' => true,
            'buses' => $buses,
            'stats' => $stats,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Format a bus model into standard Live Tracking data structure.
     */
    protected function formatLiveTrackingBus(Bus $bus): array
    {
        $lastUpdate = $bus->last_location_update;
        $secondsAgo = $lastUpdate ? $lastUpdate->diffInSeconds(now()) : null;
        $isPingingRecently = ($secondsAgo !== null && $secondsAgo <= 60);

        $rawSpeed = $isPingingRecently ? (float) cache()->get('bus_speed_'.$bus->id, 0) : 0.0;
        $speed = ($rawSpeed >= 3.0) ? round($rawSpeed, 1) : 0.0;
        $isMoving = ($speed > 0.0) && $isPingingRecently;
        $heading = (float) cache()->get('bus_heading_'.$bus->id, 0);

        // Retrieve trip currently in progress for today
        $activeTrip = $bus->trips()
            ->whereDate('trip_date', today())
            ->where('status', 'in_progress')
            ->with(['attendances.student', 'route'])
            ->latest('id')
            ->first();

        $studentsData = [];
        $waypoints = [];

        $schoolLat = $bus->school && $bus->school->latitude ? (float) $bus->school->latitude : 13.9407;
        $schoolLng = $bus->school && $bus->school->longitude ? (float) $bus->school->longitude : 43.7873;

        if ($activeTrip) {
            $isForth = ($activeTrip->type === 'forth');

            foreach ($activeTrip->attendances as $att) {
                $student = $att->student;
                if (! $student) {
                    continue;
                }

                $lat = $isForth
                    ? ($student->forth_latitude ?? $student->latitude)
                    : ($student->back_latitude ?? $student->latitude);
                $lng = $isForth
                    ? ($student->forth_longitude ?? $student->longitude)
                    : ($student->back_longitude ?? $student->longitude);

                $studentItem = [
                    'attendance_id' => $att->id,
                    'student_id' => $student->id,
                    'name' => trim(($student->first_name_ar ?? '').' '.($student->last_name_ar ?? '')) ?: ($student->first_name_en ?? 'طالب'),
                    'student_code' => $student->student_code,
                    'status' => $att->status,
                    'check_in_time' => $att->check_in_time?->format('H:i'),
                    'check_out_time' => $att->check_out_time?->format('H:i'),
                    'extra_wait_time' => $att->extra_wait_time ?? 0,
                    'lat' => $lat ? (float) $lat : null,
                    'lng' => $lng ? (float) $lng : null,
                    'address' => $student->address,
                ];

                $studentsData[] = $studentItem;

                if ($lat && $lng) {
                    $waypoints[] = [
                        'lat' => (float) $lat,
                        'lng' => (float) $lng,
                        'student_id' => $student->id,
                        'name' => $studentItem['name'],
                        'status' => $att->status,
                    ];
                }
            }

            if ($isForth) {
                $waypoints[] = [
                    'lat' => $schoolLat,
                    'lng' => $schoolLng,
                    'is_school' => true,
                    'name' => $bus->school?->name ?? 'المدرسة',
                ];
            } else {
                array_unshift($waypoints, [
                    'lat' => $schoolLat,
                    'lng' => $schoolLng,
                    'is_school' => true,
                    'name' => $bus->school?->name ?? 'المدرسة',
                ]);
            }
        }

        $assignedStudentsCount = Student::where('is_active', true)
            ->where(function ($q) use ($bus) {
                $q->where('forth_bus_id', $bus->id)
                    ->orWhere('back_bus_id', $bus->id);
            })
            ->count();

        // Fallback coordinates: if bus has null coordinates, default to school location
        $busLat = $bus->latitude ? (float) $bus->latitude : $schoolLat;
        $busLng = $bus->longitude ? (float) $bus->longitude : $schoolLng;

        return [
            'id' => $bus->id,
            'bus_number' => $bus->bus_number,
            'plate_number' => $bus->plate_number,
            'capacity' => $bus->capacity,
            'status' => $bus->status,
            'latitude' => $busLat,
            'longitude' => $busLng,
            'current_latitude' => $busLat,
            'current_longitude' => $busLng,
            'trip_status' => $activeTrip ? 'in_progress' : ($isMoving ? 'on_route' : 'idle'),
            'speed_kmh' => $speed,
            'is_moving' => $isMoving,
            'heading' => $heading,
            'school_id' => $bus->school_id,
            'school' => $bus->school ? [
                'id' => $bus->school->id,
                'name' => $bus->school->name,
                'lat' => $bus->school->latitude ? (float) $bus->school->latitude : null,
                'lng' => $bus->school->longitude ? (float) $bus->school->longitude : null,
            ] : null,
            'driver' => $bus->driver?->user ? [
                'id' => $bus->driver->user->id,
                'name' => trim(($bus->driver->user->first_name_ar ?? '').' '.($bus->driver->user->last_name_ar ?? '')) ?: ($bus->driver->user->first_name_en ?? 'سائق'),
                'phone' => $bus->driver->user->phone,
            ] : null,
            'route' => $bus->route ? [
                'id' => $bus->route->id,
                'name' => $bus->route->name,
            ] : null,
            'students_count' => $assignedStudentsCount,
            'students_on_board' => $activeTrip ? $activeTrip->attendances->whereIn('status', ['boarded', 'present'])->count() : 0,
            'active_trip' => $activeTrip ? [
                'id' => $activeTrip->id,
                'type' => $activeTrip->type,
                'status' => $activeTrip->status,
                'students' => $studentsData,
                'waypoints' => $waypoints,
            ] : null,
            'last_update' => $bus->last_location_update ? $bus->last_location_update->diffForHumans() : null,
            'last_update_seconds' => $secondsAgo,
        ];
    }
}
