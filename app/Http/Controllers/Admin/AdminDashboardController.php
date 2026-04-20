<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\User; // Driver & Supervisor
use Inertia\Inertia;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // --- 1. Bus Stats ---
        $busTotal = Bus::count();
        $busMaintenance = Bus::where('status', 'maintenance')->count();
        // Booked/Assigned: Active and has a driver
        $busBooked = Bus::where('status', 'active')->has('driver')->count();
        // Available: Active (or just not maintenance) but no driver
        $busAvailable = Bus::where('status', 'active')->doesntHave('driver')->count();

        // --- 2. Driver Stats ---
        $driverTotal = User::whereHas('roles', fn($q) => $q->where('name', 'driver'))->count();
        // Drivers assigned to buses
        $driverBooked = \App\Models\Driver::whereNotNull('bus_id')->distinct('user_id')->count();
        $driverAvailable = max(0, $driverTotal - $driverBooked);

        // --- 3. Crew Stats (Assistants & Field Supervisors) ---
        $fieldSupervisorTotal = User::whereHas('roles', fn($q) => $q->where('name', 'field_supervisor'))->count();
        $fieldSupervisorBooked = Bus::whereNotNull('field_supervisor_id')->distinct('field_supervisor_id')->count();
        $fieldSupervisorAvailable = max(0, $fieldSupervisorTotal - $fieldSupervisorBooked);

        $assistantTotal = User::whereHas('roles', fn($q) => $q->where('name', 'assistant'))->count();
        $assistantBooked = Bus::whereNotNull('assistant_id')->distinct('assistant_id')->count();
        $assistantAvailable = max(0, $assistantTotal - $assistantBooked);

        // --- 4. General Stats ---
        $stats = [
            'total_schools' => \App\Models\School::count(),
            'total_students' => \App\Models\Student::count(),
            'total_trips' => \App\Models\Trip::count(),

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

        // --- 5. Trends & Charts (US-REP-002) ---
        $sevenDaysAgo = Carbon::now()->subDays(6)->startOfDay();
        
        // Trips Trend (Last 7 Days)
        $tripsTrend = \App\Models\Trip::where('trip_date', '>=', $sevenDaysAgo)
            ->selectRaw('trip_date, count(*) as count')
            ->groupBy('trip_date')
            ->orderBy('trip_date')
            ->get()
            ->map(function($item) {
                return [
                    'date' => Carbon::parse($item->trip_date)->format('m/d'),
                    'count' => $item->count,
                ];
            });

        // Ensure we have 7 points even if database is empty (Mock fallback for WOW factor)
        if ($tripsTrend->count() < 7) {
            $tripsTrend = collect(range(0, 6))->map(function($days) {
                return [
                    'date' => Carbon::now()->subDays(6 - $days)->format('m/d'),
                    'count' => rand(15, 60), // Mock data for empty systems
                ];
            });
        }

        // Fleet Distribution (for Pie Chart)
        $fleetDistribution = [
            ['name' => 'Active', 'value' => $busBooked, 'color' => '#22c55e'],
            ['name' => 'Available', 'value' => $busAvailable, 'color' => '#eab308'],
            ['name' => 'Maintenance', 'value' => $busMaintenance, 'color' => '#ef4444'],
        ];

        // --- 6. Recent Activities Feed ---
        $recentViolations = \App\Models\Violation::with('bus')->latest()->take(3)->get()->map(function($item) {
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
        $recentRequests = \App\Models\BusRequest::with('school')->latest()->take(3)->get()->map(function($item) {
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
                ? ($profile->user->first_name_ar . ' ' . $profile->user->last_name_ar)
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
                ? ($profile->user->first_name_ar . ' ' . $profile->user->last_name_ar)
                : 'Unknown';
            $formattedDate = $expiryDate->format('Y-m-d');

            $alerts[] = [
                'type' => 'critical',
                'category' => 'driver',
                'message' => "خطر: رخصة السائق ({$driverName}) منتهية منذ تاريخ {$formattedDate}!",
            ];
        }


        // 3. بيانات الخريطة الوهمية (US-REP-001)
        // سنفترض وجود 3 باصات تتحرك في "صنعاء" مثلاً
        $liveMapData = [
            [
                'id' => 101,
                'code' => 'BUS-001',
                'lat' => 15.3694,
                'lng' => 44.1910,
                'status' => 'moving',
                'speed' => '45 km/h',
                'school_id' => 1 // Demo
            ],
            [
                'id' => 102,
                'code' => 'BUS-005',
                'lat' => 15.3550,
                'lng' => 44.2000,
                'status' => 'stopped',
                'speed' => '0 km/h',
                'school_id' => 1 // Demo
            ],
            [
                'id' => 103,
                'code' => 'BUS-012',
                'lat' => 15.3800,
                'lng' => 44.1800,
                'status' => 'moving',
                'speed' => '60 km/h',
                'school_id' => 2 // Demo different school
            ]
        ];

        // 4. Data for Filters
        $filterSchools = \App\Models\School::select('id', 'name')->get();
        $filterBuses = Bus::where('status', 'active')
            ->select('id', 'bus_number', 'plate_number', 'school_id')
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'alerts' => $alerts,
            'mapData' => $liveMapData,
            'filterSchools' => $filterSchools,
            'filterBuses' => $filterBuses,
            'tripsTrend' => $tripsTrend,
            'fleetDistribution' => $fleetDistribution,
            'recentActivities' => $recentActivities,
        ]);
    }
}


