<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\Trip;
use App\Models\TripAttendance;
use App\Models\Student;
use App\Models\Delay;
use App\Models\Violation;
use App\Models\Incident;
use App\Models\Inspection;
use App\Models\InspectionResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class ReportController extends Controller
{
    private function getSchoolId()
    {
        return Auth::user()->getSchoolId();
    }

    /**
     * مركز التقارير — Reports Hub
     */
    public function index()
    {
        $schoolId = $this->getSchoolId();
        $today = Carbon::today();
        $weekAgo = Carbon::now()->subDays(7);

        // Quick stats for the hub page
        $totalTripsThisWeek = Trip::where('school_id', $schoolId)->where('trip_date', '>=', $weekAgo)->count();
        $totalStudents = Student::inSchool($schoolId)->where('is_active', true)->count();
        $totalBuses = Bus::where('school_id', $schoolId)->where('status', 'active')->count();
        $totalDelaysThisWeek = Delay::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->where('created_at', '>=', $weekAgo)->count();
        $totalIncidents = Incident::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->where('created_at', '>=', $weekAgo)->count();

        // Attendance rate this week
        $totalAttRecords = TripAttendance::whereHas('trip', fn($q) => $q->where('school_id', $schoolId)->where('trip_date', '>=', $weekAgo))->count();
        $presentRecords = TripAttendance::whereHas('trip', fn($q) => $q->where('school_id', $schoolId)->where('trip_date', '>=', $weekAgo))
            ->whereNotNull('check_in_time')->count();
        $attendanceRate = $totalAttRecords > 0 ? round(($presentRecords / $totalAttRecords) * 100, 1) : 0;

        return Inertia::render('School/Reports/Index', [
            'stats' => [
                'totalTripsThisWeek' => $totalTripsThisWeek,
                'totalStudents' => $totalStudents,
                'totalBuses' => $totalBuses,
                'totalDelaysThisWeek' => $totalDelaysThisWeek,
                'totalIncidents' => $totalIncidents,
                'attendanceRate' => $attendanceRate,
            ],
        ]);
    }

    /**
     * تقرير حضور الطلاب — Student Attendance Report
     */
    public function studentAttendance(Request $request)
    {
        $schoolId = $this->getSchoolId();
        $dateFrom = $request->input('date_from', Carbon::today()->format('Y-m-d'));
        $dateTo = $request->input('date_to', Carbon::today()->format('Y-m-d'));
        $busId = $request->input('bus_id');

        $query = TripAttendance::with([
            'student:id,first_name_ar,last_name_ar,first_name_en,last_name_en,student_code,national_id,forth_bus_id',
            'trip:id,bus_id,trip_date,type,departure_time,arrival_time,driver_id',
            'trip.bus:id,bus_number,plate_number',
            'trip.driver:id,first_name_ar,last_name_ar',
        ])
        ->whereHas('trip', function ($q) use ($schoolId, $dateFrom, $dateTo, $busId) {
            $q->where('school_id', $schoolId)
              ->whereDate('trip_date', '>=', $dateFrom)
              ->whereDate('trip_date', '<=', $dateTo);
            if ($busId) $q->where('bus_id', $busId);
        });

        $attendances = $query->latest('id')->paginate($request->per_page == 'all' ? 5000 : ($request->per_page ?? 25))->withQueryString();

        // Stats
        $totalRecords = (clone $query)->count();
        $boardedCount = (clone $query)->whereNotNull('check_in_time')->count();
        $absentCount = $totalRecords - $boardedCount;
        $attendanceRate = $totalRecords > 0 ? round(($boardedCount / $totalRecords) * 100, 1) : 0;

        // Trend (last 7 days)
        $trend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dayQuery = TripAttendance::whereHas('trip', fn($q) => $q->where('school_id', $schoolId)->whereDate('trip_date', $date));
            $dayTotal = (clone $dayQuery)->count();
            $dayPresent = (clone $dayQuery)->whereNotNull('check_in_time')->count();
            $trend[] = [
                'date' => $date->format('m/d'),
                'label' => $date->translatedFormat('D'),
                'present' => $dayPresent,
                'absent' => max(0, $dayTotal - $dayPresent),
                'total' => $dayTotal,
            ];
        }

        $buses = Bus::where('school_id', $schoolId)->where('status', 'active')
            ->select('id', 'bus_number', 'plate_number')->get();

        return Inertia::render('School/Reports/StudentAttendance', [
            'attendances' => $attendances,
            'stats' => [
                'totalRecords' => $totalRecords,
                'boardedCount' => $boardedCount,
                'absentCount' => $absentCount,
                'attendanceRate' => $attendanceRate,
            ],
            'trend' => $trend,
            'buses' => $buses,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'bus_id' => $busId,
            ],
        ]);
    }

    /**
     * تقرير العمليات والرحلات — Trip Operations Report
     */
    public function tripOperations(Request $request)
    {
        $schoolId = $this->getSchoolId();
        $dateFrom = $request->input('date_from', Carbon::now()->subDays(7)->format('Y-m-d'));
        $dateTo = $request->input('date_to', Carbon::today()->format('Y-m-d'));
        $busId = $request->input('bus_id');

        $query = Trip::with([
            'bus:id,bus_number,plate_number,capacity',
            'driver:id,first_name_ar,last_name_ar',
            'route:id,name',
        ])
        ->where('school_id', $schoolId)
        ->whereDate('trip_date', '>=', $dateFrom)
        ->whereDate('trip_date', '<=', $dateTo);

        if ($busId) $query->where('bus_id', $busId);

        $trips = $query->latest('trip_date')->paginate($request->per_page == 'all' ? 5000 : ($request->per_page ?? 25))->withQueryString();

        // Stats
        $totalTrips = (clone $query)->count();
        $completedTrips = (clone $query)->where('status', 'finished')->count();
        $cancelledTrips = (clone $query)->where('status', 'cancelled')->count();
        $forthTrips = (clone $query)->whereIn('type', ['forth', 'morning'])->count();
        $backTrips = (clone $query)->whereIn('type', ['back', 'afternoon', 'evening'])->count();

        // Average trip duration
        $avgDuration = Trip::where('school_id', $schoolId)
            ->whereDate('trip_date', '>=', $dateFrom)
            ->whereDate('trip_date', '<=', $dateTo)
            ->whereNotNull('departure_time')
            ->whereNotNull('arrival_time')
            ->selectRaw(DB::getDriverName() === 'pgsql' 
                ? 'AVG(EXTRACT(EPOCH FROM (arrival_time - departure_time)) / 60) as avg_min'
                : 'AVG(TIMESTAMPDIFF(MINUTE, departure_time, arrival_time)) as avg_min')
            ->value('avg_min');

        // Trips per bus summary
        $tripsByBus = Trip::where('school_id', $schoolId)
            ->whereDate('trip_date', '>=', $dateFrom)
            ->whereDate('trip_date', '<=', $dateTo)
            ->with('bus:id,bus_number')
            ->selectRaw('bus_id, COUNT(*) as trip_count')
            ->groupBy('bus_id')
            ->get()
            ->map(fn($item) => [
                'bus_number' => $item->bus->bus_number ?? '—',
                'trip_count' => $item->trip_count,
                'estimated_km' => $item->trip_count * rand(12, 25), // Mock km
            ]);

        $buses = Bus::where('school_id', $schoolId)->where('status', 'active')
            ->select('id', 'bus_number', 'plate_number')->get();

        return Inertia::render('School/Reports/TripOperations', [
            'trips' => $trips,
            'stats' => [
                'totalTrips' => $totalTrips,
                'completedTrips' => $completedTrips,
                'cancelledTrips' => $cancelledTrips,
                'forthTrips' => $forthTrips,
                'backTrips' => $backTrips,
                'avgDuration' => round($avgDuration ?? 0),
            ],
            'tripsByBus' => $tripsByBus,
            'buses' => $buses,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'bus_id' => $busId,
            ],
        ]);
    }

    /**
     * تقرير السلامة والامتثال — Safety & Compliance Report
     */
    public function safetyCompliance(Request $request)
    {
        $schoolId = $this->getSchoolId();
        $dateFrom = $request->input('date_from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $dateTo = $request->input('date_to', Carbon::today()->format('Y-m-d'));

        // Incidents
        $incidents = Incident::with(['bus:id,bus_number', 'reporter:id,first_name_ar,last_name_ar'])
            ->whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->latest()
            ->paginate($request->per_page == 'all' ? 5000 : ($request->per_page ?? 15), ['*'], 'incidents_page')
            ->withQueryString();

        // Inspections
        $inspections = Inspection::with(['bus:id,bus_number', 'fieldSupervisor:id,first_name_ar,last_name_ar', 'results.item'])
            ->whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->latest()
            ->paginate($request->per_page == 'all' ? 5000 : ($request->per_page ?? 15), ['*'], 'inspections_page')
            ->withQueryString();

        // Stats
        $totalTrips = Trip::where('school_id', $schoolId)
            ->whereDate('trip_date', '>=', $dateFrom)->whereDate('trip_date', '<=', $dateTo)->count();
        $tripsWithIncidents = Incident::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->whereDate('created_at', '>=', $dateFrom)->whereDate('created_at', '<=', $dateTo)
            ->distinct('trip_id')->count('trip_id');
        $safeTrips = max(0, $totalTrips - $tripsWithIncidents);
        $safetyRate = $totalTrips > 0 ? round(($safeTrips / $totalTrips) * 100, 1) : 100;

        $totalInspections = Inspection::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->whereDate('created_at', '>=', $dateFrom)->whereDate('created_at', '<=', $dateTo)->count();
        $passedInspections = Inspection::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->where('overall_status', 'pass')
            ->whereDate('created_at', '>=', $dateFrom)->whereDate('created_at', '<=', $dateTo)->count();
        $inspectionPassRate = $totalInspections > 0 ? round(($passedInspections / $totalInspections) * 100, 1) : 100;

        $criticalIncidents = Incident::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->where('severity', 'high')
            ->whereDate('created_at', '>=', $dateFrom)->whereDate('created_at', '<=', $dateTo)->count();

        return Inertia::render('School/Reports/SafetyCompliance', [
            'incidents' => $incidents,
            'inspections' => $inspections,
            'stats' => [
                'totalTrips' => $totalTrips,
                'safeTrips' => $safeTrips,
                'safetyRate' => $safetyRate,
                'totalInspections' => $totalInspections,
                'inspectionPassRate' => $inspectionPassRate,
                'criticalIncidents' => $criticalIncidents,
                'totalIncidents' => $incidents->total(),
            ],
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    /**
     * تقرير أداء السائقين — Driver Performance Report
     */
    public function driverPerformance(Request $request)
    {
        $schoolId = $this->getSchoolId();
        $dateFrom = $request->input('date_from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $dateTo = $request->input('date_to', Carbon::today()->format('Y-m-d'));

        // Get all buses in school with their drivers
        $buses = Bus::where('school_id', $schoolId)
            ->whereNotNull('driver_id')
            ->with(['driver.user:id,first_name_ar,last_name_ar,first_name_en,last_name_en,phone'])
            ->get();

        $driverPerformance = [];

        foreach ($buses as $bus) {
            if (!$bus->driver || !$bus->driver->user) continue;

            $driverId = $bus->driver_id;
            $driverUser = $bus->driver->user;

            // Trips completed
            $tripsCompleted = Trip::where('driver_id', $driverId)
                ->where('school_id', $schoolId)
                ->where('status', 'finished')
                ->whereDate('trip_date', '>=', $dateFrom)
                ->whereDate('trip_date', '<=', $dateTo)
                ->count();

            $totalTrips = Trip::where('driver_id', $driverId)
                ->where('school_id', $schoolId)
                ->whereDate('trip_date', '>=', $dateFrom)
                ->whereDate('trip_date', '<=', $dateTo)
                ->count();

            // Delays
            $delays = Delay::where('bus_id', $bus->id)
                ->whereDate('created_at', '>=', $dateFrom)
                ->whereDate('created_at', '<=', $dateTo)
                ->count();

            $totalDelayMinutes = Delay::where('bus_id', $bus->id)
                ->whereDate('created_at', '>=', $dateFrom)
                ->whereDate('created_at', '<=', $dateTo)
                ->sum('duration_minutes');

            // Violations
            $violations = Violation::where('bus_id', $bus->id)
                ->whereDate('created_at', '>=', $dateFrom)
                ->whereDate('created_at', '<=', $dateTo)
                ->count();

            // Incidents
            $incidentCount = Incident::where('bus_id', $bus->id)
                ->whereDate('created_at', '>=', $dateFrom)
                ->whereDate('created_at', '<=', $dateTo)
                ->count();

            // Calculate performance score (out of 5 stars)
            $score = 5.0;
            if ($totalTrips > 0) {
                $completionRate = $tripsCompleted / $totalTrips;
                $score = $completionRate * 5;
            }
            // Deductions
            $score -= ($delays * 0.2);
            $score -= ($violations * 0.5);
            $score -= ($incidentCount * 0.8);
            $score = max(0, min(5, round($score, 1)));

            $driverPerformance[] = [
                'driver_id' => $driverId,
                'driver_name' => $driverUser->first_name_ar . ' ' . $driverUser->last_name_ar,
                'driver_name_en' => ($driverUser->first_name_en ?? '') . ' ' . ($driverUser->last_name_en ?? ''),
                'phone' => $driverUser->phone,
                'bus_number' => $bus->bus_number,
                'plate_number' => $bus->plate_number,
                'total_trips' => $totalTrips,
                'completed_trips' => $tripsCompleted,
                'delays' => $delays,
                'total_delay_minutes' => $totalDelayMinutes,
                'violations' => $violations,
                'incidents' => $incidentCount,
                'score' => $score,
            ];
        }

        // Sort by score descending
        usort($driverPerformance, fn($a, $b) => $b['score'] <=> $a['score']);

        // Paginate results
        $perPage = $request->per_page == 'all' ? 5000 : ($request->per_page ?? 25);
        $page = $request->input('page', 1);
        $paginatedDrivers = new \Illuminate\Pagination\LengthAwarePaginator(
            collect($driverPerformance)->forPage($page, $perPage)->values(),
            count($driverPerformance),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('School/Reports/DriverPerformance', [
            'drivers' => $paginatedDrivers,
            'stats' => [
                'totalDrivers' => count($driverPerformance),
                'avgScore' => count($driverPerformance) > 0 ? round(collect($driverPerformance)->avg('score'), 1) : 0,
                'topPerformer' => count($driverPerformance) > 0 ? $driverPerformance[0]['driver_name'] : '—',
                'totalTripsAll' => collect($driverPerformance)->sum('total_trips'),
            ],
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    /**
     * تقرير التأخيرات والالتزام بالمواعيد — Delay & Punctuality Report
     */
    public function delayPunctuality(Request $request)
    {
        $schoolId = $this->getSchoolId();
        $dateFrom = $request->input('date_from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $dateTo = $request->input('date_to', Carbon::today()->format('Y-m-d'));
        $type = $request->input('type'); // student or bus
        $busId = $request->input('bus_id');

        $query = Delay::with([
            'student:id,first_name_ar,last_name_ar,first_name_en,last_name_en,student_code,national_id',
            'bus:id,bus_number,plate_number',
            'reporter:id,first_name_ar,last_name_ar',
        ])
        ->whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
        ->whereDate('created_at', '>=', $dateFrom)
        ->whereDate('created_at', '<=', $dateTo);

        if ($type) $query->where('type', $type);
        if ($busId) $query->where('bus_id', $busId);

        $delays = $query->latest()->paginate($request->per_page == 'all' ? 5000 : ($request->per_page ?? 25))->withQueryString();

        // Stats
        $totalDelays = (clone $query)->count();
        $totalMinutes = (clone $query)->sum('duration_minutes');
        $avgMinutes = $totalDelays > 0 ? round($totalMinutes / $totalDelays, 1) : 0;
        $busDelays = Delay::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->where('type', 'bus')
            ->whereDate('created_at', '>=', $dateFrom)->whereDate('created_at', '<=', $dateTo)->count();
        $studentDelays = Delay::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->where('type', 'student')
            ->whereDate('created_at', '>=', $dateFrom)->whereDate('created_at', '<=', $dateTo)->count();

        // Trend
        $trend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dayCount = Delay::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
                ->whereDate('created_at', $date)->count();
            $dayMinutes = Delay::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
                ->whereDate('created_at', $date)->sum('duration_minutes');
            $trend[] = [
                'date' => $date->format('m/d'),
                'label' => $date->translatedFormat('D'),
                'count' => $dayCount,
                'minutes' => $dayMinutes,
            ];
        }

        $buses = Bus::where('school_id', $schoolId)->where('status', 'active')
            ->select('id', 'bus_number', 'plate_number')->get();

        return Inertia::render('School/Reports/DelayPunctuality', [
            'delays' => $delays,
            'stats' => [
                'totalDelays' => $totalDelays,
                'totalMinutes' => $totalMinutes,
                'avgMinutes' => $avgMinutes,
                'busDelays' => $busDelays,
                'studentDelays' => $studentDelays,
            ],
            'trend' => $trend,
            'buses' => $buses,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'type' => $type,
                'bus_id' => $busId,
            ],
        ]);
    }

    /**
     * تقرير السرعة والانضباط — Speed & Discipline Report (بيانات وهمية جزئياً)
     */
    public function speedDiscipline(Request $request)
    {
        $schoolId = $this->getSchoolId();
        $dateFrom = $request->input('date_from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $dateTo = $request->input('date_to', Carbon::today()->format('Y-m-d'));

        // Violations (real data)
        $violations = Violation::with(['bus:id,bus_number,plate_number', 'fieldSupervisor:id,first_name_ar,last_name_ar'])
            ->whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->latest()
            ->paginate($request->per_page == 'all' ? 5000 : ($request->per_page ?? 25))
            ->withQueryString();

        $totalViolations = Violation::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->whereDate('created_at', '>=', $dateFrom)->whereDate('created_at', '<=', $dateTo)->count();

        // Mock speed data per bus
        $buses = Bus::where('school_id', $schoolId)->where('status', 'active')
            ->select('id', 'bus_number', 'plate_number')->get();

        $speedData = $buses->map(fn($bus) => [
            'bus_number' => $bus->bus_number,
            'plate_number' => $bus->plate_number,
            'avg_speed' => rand(35, 55),
            'max_speed' => rand(55, 85),
            'speed_violations' => rand(0, 4),
            'compliance_rate' => rand(85, 100),
        ]);

        $violationsByBus = Violation::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->whereDate('created_at', '>=', $dateFrom)->whereDate('created_at', '<=', $dateTo)
            ->selectRaw('bus_id, COUNT(*) as count')
            ->groupBy('bus_id')
            ->with('bus:id,bus_number')
            ->get()
            ->map(fn($item) => [
                'bus_number' => $item->bus->bus_number ?? '—',
                'count' => $item->count,
            ]);

        return Inertia::render('School/Reports/SpeedDiscipline', [
            'violations' => $violations,
            'speedData' => $speedData,
            'violationsByBus' => $violationsByBus,
            'stats' => [
                'totalViolations' => $totalViolations,
                'avgSpeed' => 42,
                'maxRecordedSpeed' => 78,
                'complianceRate' => rand(88, 98),
            ],
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }
}
