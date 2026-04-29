<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\Bus;
use App\Models\BusExpense;
use App\Models\Student;
use App\Models\TripAttendance;
use App\Models\Violation;
use App\Models\Incident;
use App\Models\Delay;
use App\Models\Inspection;
use App\Models\Driver;
use App\Models\User;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    /**
     * Analytics Hub — Central KPI Dashboard
     */
    public function index(Request $request)
    {
        $now = Carbon::now();
        $monthStart = $now->copy()->startOfMonth();
        $monthEnd = $now->copy()->endOfMonth();

        // ── Safe Trips (completed without incidents) ──
        $totalTripsMonth = Trip::whereBetween('trip_date', [$monthStart, $monthEnd])->count();
        $completedTripsMonth = Trip::whereBetween('trip_date', [$monthStart, $monthEnd])
            ->where('status', 'completed')->count();
        $tripsWithIncidents = Incident::whereBetween('created_at', [$monthStart, $monthEnd])
            ->distinct('trip_id')->count('trip_id');
        $safeTrips = max(0, $completedTripsMonth - $tripsWithIncidents);
        $safeTripsPercent = $completedTripsMonth > 0 ? round(($safeTrips / $completedTripsMonth) * 100, 1) : 0;

        // ── On-time Arrival % ──
        $tripsWithTimes = Trip::whereBetween('trip_date', [$monthStart, $monthEnd])
            ->where('status', 'completed')
            ->whereNotNull('arrival_time')
            ->whereNotNull('departure_time')
            ->count();
        // Consider "on time" if arrived within 60 minutes
        $onTimeTrips = Trip::whereBetween('trip_date', [$monthStart, $monthEnd])
            ->where('status', 'completed')
            ->whereNotNull('arrival_time')
            ->whereNotNull('departure_time')
            ->whereRaw('EXTRACT(EPOCH FROM (arrival_time - departure_time)) / 60 <= 60')
            ->count();
        $onTimePercent = $tripsWithTimes > 0 ? round(($onTimeTrips / $tripsWithTimes) * 100, 1) : 0;

        // ── Fleet Utilization % ──
        $activeBuses = Bus::where('status', 'active')->get();
        $totalCapacity = $activeBuses->sum('capacity');
        $totalStudents = Student::where('is_active', true)->count();
        $utilizationPercent = $totalCapacity > 0 ? round(($totalStudents / $totalCapacity) * 100, 1) : 0;

        // ── Monthly Expenses ──
        $monthlyExpenses = BusExpense::whereBetween('date', [$monthStart, $monthEnd])->sum('amount');

        // ── Quick Stats ──
        $totalDrivers = Driver::count();
        $totalViolations = Violation::whereBetween('created_at', [$monthStart, $monthEnd])->count();
        $totalDelays = Delay::whereBetween('created_at', [$monthStart, $monthEnd])->count();

        return Inertia::render('Admin/Analytics/Index', [
            'kpis' => [
                'safe_trips_percent' => $safeTripsPercent,
                'safe_trips' => $safeTrips,
                'total_completed' => $completedTripsMonth,
                'on_time_percent' => $onTimePercent,
                'on_time_trips' => $onTimeTrips,
                'total_with_times' => $tripsWithTimes,
                'utilization_percent' => $utilizationPercent,
                'total_students' => $totalStudents,
                'total_capacity' => $totalCapacity,
                'monthly_expenses' => round($monthlyExpenses, 2),
                'total_trips_month' => $totalTripsMonth,
                'total_drivers' => $totalDrivers,
                'total_violations' => $totalViolations,
                'total_delays' => $totalDelays,
                'active_buses' => $activeBuses->count(),
            ],
            'month_label' => $now->translatedFormat('F Y'),
        ]);
    }

    /**
     * Operational Reports — Safe trips, on-time analysis, utilization
     */
    public function operational(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        // ── Daily Safe Trips Trend ──
        $dailyTrips = Trip::select(
                DB::raw("trip_date::date as date"),
                DB::raw("COUNT(*) as total"),
                DB::raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed"),
                DB::raw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled")
            )
            ->whereBetween('trip_date', [$dateFrom, $dateTo])
            ->groupBy(DB::raw('trip_date::date'))
            ->orderBy('date')
            ->get();

        // Incidents per day for safe trip calculation
        $dailyIncidents = Incident::select(
                DB::raw("created_at::date as date"),
                DB::raw("COUNT(DISTINCT trip_id) as incident_trips")
            )
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy(DB::raw('created_at::date'))
            ->pluck('incident_trips', 'date');

        $safeTripsTrend = $dailyTrips->map(function ($day) use ($dailyIncidents) {
            $incidents = $dailyIncidents[$day->date] ?? 0;
            $safe = max(0, $day->completed - $incidents);
            return [
                'date' => $day->date,
                'total' => $day->total,
                'completed' => $day->completed,
                'safe' => $safe,
                'cancelled' => $day->cancelled,
            ];
        });

        // Pre-fetch trip counts
        $tripCounts = Trip::select('bus_id', DB::raw('COUNT(*) as count'))
            ->where('status', 'completed')
            ->whereBetween('trip_date', [$dateFrom, $dateTo])
            ->groupBy('bus_id')
            ->pluck('count', 'bus_id');

        // Pre-fetch student counts
        $forthCounts = Student::select('forth_bus_id', DB::raw('COUNT(*) as count'))
            ->where('is_active', true)->whereNotNull('forth_bus_id')
            ->groupBy('forth_bus_id')->pluck('count', 'forth_bus_id');
            
        $backCounts = Student::select('back_bus_id', DB::raw('COUNT(*) as count'))
            ->where('is_active', true)->whereNotNull('back_bus_id')
            ->groupBy('back_bus_id')->pluck('count', 'back_bus_id');

        // ── Bus Utilization Table ──
        $buses = Bus::where('status', 'active')
            ->with(['driver.user', 'route:id,name', 'school:id,name'])
            ->get()
            ->map(function ($bus) use ($tripCounts, $forthCounts, $backCounts) {
                $tripCount = $tripCounts[$bus->id] ?? 0;
                $forthCount = $forthCounts[$bus->id] ?? 0;
                $backCount = $backCounts[$bus->id] ?? 0;
                $maxStudents = max($forthCount, $backCount);
                $utilization = $bus->capacity > 0 ? round(($maxStudents / $bus->capacity) * 100, 1) : 0;
                
                return [
                    'id' => $bus->id,
                    'bus_number' => $bus->bus_number,
                    'plate_number' => $bus->plate_number,
                    'capacity' => $bus->capacity,
                    'students_count' => $maxStudents,
                    'utilization' => $utilization,
                    'completed_trips' => $tripCount,
                    'driver_name' => $bus->driver?->user?->name ?? '—',
                    'route_name' => $bus->route?->name ?? '—',
                    'school_name' => $bus->school?->name ?? '—',
                ];
            });

        // ── On-time per Bus ──
        $onTimePerBus = Trip::with('bus:id,bus_number')
            ->select(
                'bus_id',
                DB::raw("COUNT(*) as total"),
                DB::raw("SUM(CASE WHEN EXTRACT(EPOCH FROM (arrival_time - departure_time)) / 60 <= 60 THEN 1 ELSE 0 END) as on_time")
            )
            ->whereBetween('trip_date', [$dateFrom, $dateTo])
            ->where('status', 'completed')
            ->whereNotNull('arrival_time')
            ->whereNotNull('departure_time')
            ->groupBy('bus_id')
            ->get()
            ->map(function ($row) {
                return [
                    'bus_number' => $row->bus?->bus_number ?? '—',
                    'total' => $row->total,
                    'on_time' => $row->on_time,
                    'percent' => $row->total > 0 ? round(($row->on_time / $row->total) * 100, 1) : 0,
                ];
            });

        // ── Summary KPIs ──
        $totalCompleted = Trip::whereBetween('trip_date', [$dateFrom, $dateTo])
            ->where('status', 'completed')->count();
        $totalIncidents = Incident::whereBetween('created_at', [$dateFrom, $dateTo])
            ->distinct('trip_id')->count('trip_id');
        $totalSafe = max(0, $totalCompleted - $totalIncidents);

        return Inertia::render('Admin/Analytics/OperationalReports', [
            'safeTripsTrend' => $safeTripsTrend,
            'buses' => $buses,
            'onTimePerBus' => $onTimePerBus,
            'summary' => [
                'total_completed' => $totalCompleted,
                'total_safe' => $totalSafe,
                'safe_percent' => $totalCompleted > 0 ? round(($totalSafe / $totalCompleted) * 100, 1) : 0,
                'total_trips' => Trip::whereBetween('trip_date', [$dateFrom, $dateTo])->count(),
            ],
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    /**
     * Driver Analytics — Scorecards & violation history
     */
    public function driverAnalytics(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        // Pre-fetch all driver stats to avoid N+1 queries
        $completedTrips = Trip::select('driver_id', DB::raw('COUNT(*) as count'))
            ->where('status', 'completed')->whereBetween('trip_date', [$dateFrom, $dateTo])
            ->groupBy('driver_id')->pluck('count', 'driver_id');

        $totalTrips = Trip::select('driver_id', DB::raw('COUNT(*) as count'))
            ->whereBetween('trip_date', [$dateFrom, $dateTo])
            ->groupBy('driver_id')->pluck('count', 'driver_id');

        $onTimeTrips = Trip::select('driver_id', DB::raw('COUNT(*) as count'))
            ->where('status', 'completed')->whereBetween('trip_date', [$dateFrom, $dateTo])
            ->whereNotNull('arrival_time')->whereNotNull('departure_time')
            ->whereRaw('EXTRACT(EPOCH FROM (arrival_time - departure_time)) / 60 <= 60')
            ->groupBy('driver_id')->pluck('count', 'driver_id');

        $buses = Bus::whereNotNull('driver_id')->pluck('id', 'driver_id'); // [driver_id => bus_id]
        $busIdsList = $buses->values()->toArray();

        $violations = Violation::select('bus_id', DB::raw('COUNT(*) as count'))
            ->whereIn('bus_id', $busIdsList)->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('bus_id')->pluck('count', 'bus_id');

        $delays = Delay::select('bus_id', DB::raw('COUNT(*) as count'))
            ->whereIn('bus_id', $busIdsList)->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('bus_id')->pluck('count', 'bus_id');

        $inspections = Inspection::select('bus_id', DB::raw('COUNT(*) as count'))
            ->whereIn('bus_id', $busIdsList)->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('bus_id')->pluck('count', 'bus_id');

        $inspectionsPassed = Inspection::select('bus_id', DB::raw('COUNT(*) as count'))
            ->whereIn('bus_id', $busIdsList)->where('overall_status', 'pass')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('bus_id')->pluck('count', 'bus_id');
            
        $busesWithNumbers = Bus::whereNotNull('driver_id')->pluck('bus_number', 'driver_id');

        // Get all drivers with their user data
        $drivers = Driver::with('user')
            ->get()
            ->map(function ($driver) use (
                $completedTrips, $totalTrips, $onTimeTrips, $buses, 
                $violations, $delays, $inspections, $inspectionsPassed, $busesWithNumbers
            ) {
                $userId = $driver->user_id;
                
                $cTrips = $completedTrips[$userId] ?? 0;
                $tTrips = $totalTrips[$userId] ?? 0;
                $oTimeTrips = $onTimeTrips[$userId] ?? 0;
                
                $busId = $buses[$userId] ?? null;
                $v = $busId ? ($violations[$busId] ?? 0) : 0;
                $d = $busId ? ($delays[$busId] ?? 0) : 0;
                $i = $busId ? ($inspections[$busId] ?? 0) : 0;
                $ip = $busId ? ($inspectionsPassed[$busId] ?? 0) : 0;

                // Calculate score (0-100)
                $score = $this->calculateDriverScore($cTrips, $tTrips, $v, $d, $oTimeTrips, $i, $ip);

                return [
                    'id' => $driver->id,
                    'user_id' => $userId,
                    'name' => $driver->user?->name ?? '—',
                    'phone' => $driver->user?->phone ?? '—',
                    'image' => $driver->user?->image ?? null,
                    'license_number' => $driver->license_number,
                    'license_expiry' => $driver->license_expiry_date,
                    'status' => $driver->status,
                    'completed_trips' => $cTrips,
                    'total_trips' => $tTrips,
                    'violations' => $v,
                    'delays' => $d,
                    'inspections' => $i,
                    'inspections_passed' => $ip,
                    'on_time_trips' => $oTimeTrips,
                    'score' => $score,
                    'bus_number' => $busesWithNumbers[$userId] ?? '—',
                ];
            })
            ->sortByDesc('score')
            ->values();

        // Violations list with driver context
        $violationsList = Violation::with(['bus:id,bus_number,driver_id', 'fieldSupervisor'])
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->latest()
            ->limit(50)
            ->get()
            ->map(function ($v) {
                $driverUser = $v->bus ? User::find($v->bus->driver_id) : null;
                return [
                    'id' => $v->id,
                    'type' => $v->type,
                    'description' => $v->description,
                    'status' => $v->status,
                    'date' => $v->created_at->format('Y-m-d'),
                    'bus_number' => $v->bus?->bus_number ?? '—',
                    'driver_name' => $driverUser?->name ?? '—',
                    'supervisor_name' => $v->fieldSupervisor?->name ?? '—',
                ];
            });

        return Inertia::render('Admin/Analytics/DriverAnalytics', [
            'drivers' => $drivers,
            'violations' => $violationsList,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    /**
     * Financial Reports — Fuel & Maintenance
     */
    public function financial(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        // ── Expenses by type ──
        $expensesByType = BusExpense::select('type', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->groupBy('type')
            ->get();

        // ── Expenses per bus ──
        $expensesPerBus = BusExpense::with('bus:id,bus_number,plate_number')
            ->select(
                'bus_id',
                DB::raw("SUM(CASE WHEN type = 'fuel' THEN amount ELSE 0 END) as fuel_cost"),
                DB::raw("SUM(CASE WHEN type = 'maintenance' THEN amount ELSE 0 END) as maintenance_cost"),
                DB::raw("SUM(CASE WHEN type NOT IN ('fuel', 'maintenance') THEN amount ELSE 0 END) as other_cost"),
                DB::raw("SUM(amount) as total_cost"),
                DB::raw("COUNT(*) as entries")
            )
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->groupBy('bus_id')
            ->get()
            ->map(function ($row) {
                return [
                    'bus_id' => $row->bus_id,
                    'bus_number' => $row->bus?->bus_number ?? '—',
                    'plate_number' => $row->bus?->plate_number ?? '—',
                    'fuel_cost' => round($row->fuel_cost, 2),
                    'maintenance_cost' => round($row->maintenance_cost, 2),
                    'other_cost' => round($row->other_cost, 2),
                    'total_cost' => round($row->total_cost, 2),
                    'entries' => $row->entries,
                ];
            });

        // ── Monthly trend ──
        $monthlyTrend = BusExpense::select(
                DB::raw("TO_CHAR(date, 'YYYY-MM') as month"),
                DB::raw("SUM(CASE WHEN type = 'fuel' THEN amount ELSE 0 END) as fuel"),
                DB::raw("SUM(CASE WHEN type = 'maintenance' THEN amount ELSE 0 END) as maintenance"),
                DB::raw("SUM(CASE WHEN type NOT IN ('fuel', 'maintenance') THEN amount ELSE 0 END) as other"),
                DB::raw("SUM(amount) as total")
            )
            ->where('date', '>=', Carbon::now()->subMonths(6)->startOfMonth())
            ->groupBy(DB::raw("TO_CHAR(date, 'YYYY-MM')"))
            ->orderBy('month')
            ->get();

        // ── Summary ──
        $totalExpenses = BusExpense::whereBetween('date', [$dateFrom, $dateTo])->sum('amount');
        $fuelTotal = BusExpense::where('type', 'fuel')->whereBetween('date', [$dateFrom, $dateTo])->sum('amount');
        $maintenanceTotal = BusExpense::where('type', 'maintenance')->whereBetween('date', [$dateFrom, $dateTo])->sum('amount');

        return Inertia::render('Admin/Analytics/FinancialReports', [
            'expensesByType' => $expensesByType,
            'expensesPerBus' => $expensesPerBus,
            'monthlyTrend' => $monthlyTrend,
            'summary' => [
                'total' => round($totalExpenses, 2),
                'fuel' => round($fuelTotal, 2),
                'maintenance' => round($maintenanceTotal, 2),
                'other' => round($totalExpenses - $fuelTotal - $maintenanceTotal, 2),
            ],
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    /**
     * Student Insights — Attendance trends & absence patterns
     */
    public function studentInsights(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());
        $schoolId = $request->input('school_id');

        // ── Absence by day of week ──
        $absenceByDayQuery = TripAttendance::join('trips', 'trip_attendances.trip_id', '=', 'trips.id')
            ->join('routes', 'trips.route_id', '=', 'routes.id')
            ->where('trip_attendances.status', 'absent')
            ->whereBetween('trips.trip_date', [$dateFrom, $dateTo]);

        if ($schoolId && $schoolId !== 'all') {
            $absenceByDayQuery->where('routes.school_id', $schoolId);
        }

        $absenceByDay = $absenceByDayQuery->select(
                DB::raw("EXTRACT(DOW FROM trips.trip_date) as day_num"),
                DB::raw("COUNT(*) as absent_count")
            )
            ->groupBy(DB::raw('EXTRACT(DOW FROM trips.trip_date)'))
            ->orderBy('day_num')
            ->get()
            ->map(function ($row) {
                // PostgreSQL DOW: 0=Sunday, 1=Monday, ..., 6=Saturday
                $days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                $daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                $idx = (int) $row->day_num;
                return [
                    'day_num' => $idx,
                    'day_ar' => $days[$idx] ?? '',
                    'day_en' => $daysEn[$idx] ?? '',
                    'absent_count' => $row->absent_count,
                ];
            });

        // ── School List for Filter ──
        $schools = School::select('id', 'name')->get();

        // ── Grouped Absences by School & Students ──
        $absenceQuery = TripAttendance::join('trips', 'trip_attendances.trip_id', '=', 'trips.id')
            ->join('routes', 'trips.route_id', '=', 'routes.id')
            ->join('schools', 'routes.school_id', '=', 'schools.id')
            ->join('students', 'trip_attendances.student_id', '=', 'students.id')
            ->where('trip_attendances.status', 'absent')
            ->whereBetween('trips.trip_date', [$dateFrom, $dateTo])
            ->select(
                'schools.id as school_id',
                'schools.name as school_name',
                'students.id as student_id',
                'students.first_name_ar',
                'students.last_name_ar',
                'students.student_code',
                DB::raw("COUNT(*) as absent_count")
            )
            ->groupBy('schools.id', 'schools.name', 'students.id', 'students.first_name_ar', 'students.last_name_ar', 'students.student_code')
            ->orderBy('schools.name')
            ->orderByDesc('absent_count');

        if ($schoolId && $schoolId !== 'all') {
            $absenceQuery->where('schools.id', $schoolId);
        }

        $absentStudentsData = $absenceQuery->get();
        
        $groupedAbsencesAssoc = [];
        foreach ($absentStudentsData as $row) {
            $sId = $row->school_id;
            if (!isset($groupedAbsencesAssoc[$sId])) {
                $groupedAbsencesAssoc[$sId] = [
                    'school_id' => $sId,
                    'school_name' => $row->school_name,
                    'total_absences' => 0,
                    'total_students_absent' => 0,
                    'students' => []
                ];
            }
            $groupedAbsencesAssoc[$sId]['total_absences'] += $row->absent_count;
            $groupedAbsencesAssoc[$sId]['total_students_absent'] += 1;
            $groupedAbsencesAssoc[$sId]['students'][] = [
                'id' => $row->student_id,
                'name' => $row->first_name_ar . ' ' . $row->last_name_ar,
                'code' => $row->student_code,
                'absent_count' => $row->absent_count
            ];
        }
        $groupedAbsences = array_values($groupedAbsencesAssoc);

        // ── Absence by route ──
        $absenceByRouteQuery = TripAttendance::join('trips', 'trip_attendances.trip_id', '=', 'trips.id')
            ->join('routes', 'trips.route_id', '=', 'routes.id')
            ->where('trip_attendances.status', 'absent')
            ->whereBetween('trips.trip_date', [$dateFrom, $dateTo]);

        if ($schoolId && $schoolId !== 'all') {
            $absenceByRouteQuery->where('routes.school_id', $schoolId);
        }

        $absenceByRoute = $absenceByRouteQuery->select(
                'routes.id as route_id',
                'routes.name as route_name',
                DB::raw("COUNT(*) as absent_count")
            )
            ->groupBy('routes.id', 'routes.name')
            ->orderByDesc('absent_count')
            ->limit(10)
            ->get();

        // ── Weekly trend ──
        $weeklyTrendQuery = TripAttendance::join('trips', 'trip_attendances.trip_id', '=', 'trips.id')
            ->join('routes', 'trips.route_id', '=', 'routes.id')
            ->whereBetween('trips.trip_date', [$dateFrom, $dateTo]);

        if ($schoolId && $schoolId !== 'all') {
            $weeklyTrendQuery->where('routes.school_id', $schoolId);
        }

        $weeklyTrend = $weeklyTrendQuery->select(
                DB::raw("EXTRACT(WEEK FROM trips.trip_date) as week"),
                DB::raw("MIN(trips.trip_date) as week_start"),
                DB::raw("SUM(CASE WHEN trip_attendances.status = 'boarded' THEN 1 ELSE 0 END) as present"),
                DB::raw("SUM(CASE WHEN trip_attendances.status = 'absent' THEN 1 ELSE 0 END) as absent"),
                DB::raw("COUNT(*) as total")
            )
            ->groupBy(DB::raw('EXTRACT(WEEK FROM trips.trip_date)'))
            ->orderBy('week')
            ->get();

        // ── Summary KPIs ──
        $baseSummaryQuery = TripAttendance::join('trips', 'trip_attendances.trip_id', '=', 'trips.id')
            ->join('routes', 'trips.route_id', '=', 'routes.id')
            ->whereBetween('trips.trip_date', [$dateFrom, $dateTo]);

        if ($schoolId && $schoolId !== 'all') {
            $baseSummaryQuery->where('routes.school_id', $schoolId);
        }

        $totalAttendance = (clone $baseSummaryQuery)->count();
        $totalPresent = (clone $baseSummaryQuery)->where('trip_attendances.status', 'boarded')->count();
        $totalAbsent = (clone $baseSummaryQuery)->where('trip_attendances.status', 'absent')->count();

        return Inertia::render('Admin/Analytics/StudentInsights', [
            'absenceByDay' => $absenceByDay,
            'absenceByRoute' => $absenceByRoute,
            'weeklyTrend' => $weeklyTrend,
            'groupedAbsences' => $groupedAbsences,
            'schools' => $schools,
            'summary' => [
                'total_records' => $totalAttendance,
                'present' => $totalPresent,
                'absent' => $totalAbsent,
                'attendance_rate' => $totalAttendance > 0 ? round(($totalPresent / $totalAttendance) * 100, 1) : 0,
            ],
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'school_id' => $schoolId ?? 'all',
            ],
        ]);
    }

    /**
     * Calculate driver performance score (0-100)
     */
    private function calculateDriverScore(
        int $completedTrips,
        int $totalTrips,
        int $violations,
        int $delays,
        int $onTimeTrips,
        int $inspections,
        int $inspectionsPassed
    ): int {
        $score = 50; // Base score

        // Completion rate (0-25 points)
        if ($totalTrips > 0) {
            $score += round(($completedTrips / $totalTrips) * 25);
        }

        // On-time rate (0-25 points)
        if ($completedTrips > 0) {
            $score += round(($onTimeTrips / $completedTrips) * 25);
        }

        // Violations penalty (-5 per violation, max -20)
        $score -= min(20, $violations * 5);

        // Delays penalty (-3 per delay, max -15)
        $score -= min(15, $delays * 3);

        // Inspection bonus (0-10 points)
        if ($inspections > 0) {
            $score += round(($inspectionsPassed / $inspections) * 10);
        }

        // Active driver bonus (+5 for having trips)
        if ($totalTrips > 0) {
            $score += 5;
        }

        return max(0, min(100, $score));
    }
}
