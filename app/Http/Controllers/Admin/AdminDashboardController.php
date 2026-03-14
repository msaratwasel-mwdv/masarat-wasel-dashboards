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
        $busBooked = Bus::where('status', 'active')->whereNotNull('driver_id')->count();
        // Available: Active (or just not maintenance) but no driver
        // Note: Strict definition of available might be 'active' and no driver.
        $busAvailable = Bus::where('status', 'active')->whereNull('driver_id')->count();

        // --- 2. Driver Stats ---
        $driverTotal = User::where('role', 'driver')->count();
        // Drivers assigned to buses
        $driverBooked = Bus::whereNotNull('driver_id')->distinct('driver_id')->count();
        $driverAvailable = max(0, $driverTotal - $driverBooked);

        // --- 3. Supervisor Stats ---
        $supervisorTotal = User::where('role', 'supervisor')->count();
        // Supervisors assigned to buses
        $supervisorBooked = Bus::whereNotNull('supervisor_id')->distinct('supervisor_id')->count();
        $supervisorAvailable = max(0, $supervisorTotal - $supervisorBooked);

        // --- 4. General Stats ---
        $stats = [
            'total_schools' => \App\Models\School::count(),
            'total_students' => \App\Models\Student::count(),

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

            // Supervisors Detailed
            'supervisors' => [
                'total' => $supervisorTotal,
                'available' => $supervisorAvailable,
                'booked' => $supervisorBooked,
            ],
        ];

        // 2. منطق التنبيهات (US-ALT-001)
        $alerts = [];

        // أ. فحص الباصات النشطة بدون سائقين (Existing)
        $unassignedBuses = Bus::where('status', 'active')
            ->whereNull('driver_id')
            ->get();

        foreach ($unassignedBuses as $bus) {
            $alerts[] = [
                'type' => 'warning',
                'category' => 'bus', // Icon category
                'message' => "تحذير: الحافلة ({$bus->plate_number}) نشطة ولكن لم يتم تعيين سائق لها!",
            ];
        }

        // ب. فحص انتهاء الرخص (Real Logic)
        // نبحث عن السائقين الذين ستنتهي رخصهم خلال 30 يوم
        $expiringLicenses = \App\Models\DriverProfile::with('user')
            ->whereDate('license_expiry_date', '<=', Carbon::now()->addDays(30))
            ->whereDate('license_expiry_date', '>=', Carbon::now()) // لم تنتهِ بعد، بل ستنتهي قريباً
            ->get();

        foreach ($expiringLicenses as $profile) {
            $expiryDate = Carbon::parse($profile->license_expiry_date);
            $daysLeft = (int) ceil(Carbon::now()->floatDiffInDays($expiryDate, false)); // Ensure positive int
            $driverName = $profile->user ? $profile->user->name : 'Unknown';
            $formattedDate = $expiryDate->format('Y-m-d');

            $alerts[] = [
                'type' => 'critical',
                'category' => 'driver',
                'message' => "تنبيه: رخصة السائق ({$driverName}) تنتهي بتاريخ {$formattedDate} (متبقي: {$daysLeft} يوم).",
            ];
        }

        // ج. فحص الرخص المنتهية فعلياً (Expired)
        $expiredLicenses = \App\Models\DriverProfile::with('user')
            ->whereDate('license_expiry_date', '<', Carbon::now())
            ->get();

        foreach ($expiredLicenses as $profile) {
            $expiryDate = Carbon::parse($profile->license_expiry_date);
            $driverName = $profile->user ? $profile->user->name : 'Unknown';
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
            ->select('id', 'bus_code', 'plate_number', 'school_id')
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'alerts' => $alerts,
            'mapData' => $liveMapData,
            'filterSchools' => $filterSchools,
            'filterBuses' => $filterBuses,
        ]);
    }
}
