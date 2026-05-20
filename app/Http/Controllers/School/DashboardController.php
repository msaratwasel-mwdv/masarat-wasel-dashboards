<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Delay;
use App\Models\FieldTrip;
use App\Models\Student;
use App\Models\Trip;
use App\Models\TripAttendance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $schoolId = Auth::user()->getSchoolId();
        $today    = now()->format('Y-m-d');
        $weekAgo  = Carbon::now()->subDays(7);

        // ─── 1. Inventory Counts (needed for context only) ────────────────────
        $studentsCount  = Student::inSchool($schoolId)->count();
        $classesCount   = Classroom::atSchool($schoolId)->count();
        $totalBuses     = \App\Models\Bus::where('school_id', $schoolId)->count();
        $activeBuses    = \App\Models\Bus::where('school_id', $schoolId)->where('status', 'active')->count();
        $routesCount    = \App\Models\Route::where('school_id', $schoolId)->count();
        $teachersCount  = \App\Models\Teacher::where('school_id', $schoolId)->count();

        // ─── 2. Today's Attendance (school-level) ────────────────────────────
        $attendanceQuery        = Attendance::whereDate('date', $today)
            ->whereHas('student', fn($q) => $q->inSchool($schoolId));
        $totalAttendanceRecords = (clone $attendanceQuery)->count();
        $presentCount           = (clone $attendanceQuery)->where('status', 'present')->count();
        $attendancePercentage   = $totalAttendanceRecords > 0
            ? round(($presentCount / $totalAttendanceRecords) * 100, 1)
            : 0;

        // ─── 3. Operational KPIs — TRANSPORT (today) ─────────────────────────

        // All trip types: 'morning', 'forth', 'back'
        $todayTripsQuery   = Trip::where('school_id', $schoolId)->whereDate('trip_date', $today);
        $totalTripsToday   = (clone $todayTripsQuery)->count();
        $completedTripsToday = (clone $todayTripsQuery)->where('status', 'finished')->count();

        // Students who actually boarded a bus today
        $studentsTransportedToday = TripAttendance::whereHas(
            'trip',
            fn($q) => $q->where('school_id', $schoolId)->whereDate('trip_date', $today)
        )
            ->whereNotNull('check_in_time')
            ->distinct('student_id')
            ->count('student_id');

        // Trip success rate — last 7 days
        $tripsWeekTotal    = Trip::where('school_id', $schoolId)
            ->where('trip_date', '>=', $weekAgo)->count();
        $tripsWeekFinished = Trip::where('school_id', $schoolId)
            ->where('trip_date', '>=', $weekAgo)
            ->where('status', 'finished')->count();
        $tripSuccessRate   = $tripsWeekTotal > 0
            ? round(($tripsWeekFinished / $tripsWeekTotal) * 100, 1)
            : 0;

        // Delays this month (via bus → school_id)
        $delaysThisMonth = Delay::whereHas(
            'bus',
            fn($q) => $q->where('school_id', $schoolId)
        )->whereMonth('created_at', now()->month)->count();

        // Completed field trips (all time for this school)
        $completedFieldTrips = FieldTrip::where('school_id', $schoolId)
            ->where('status', 'completed')->count();

        // Active trips right now
        $activeTripsNow = (clone $todayTripsQuery)->where('status', 'in_progress')->count();

        // Delayed buses currently (in progress, and now > arrival_time + 15 mins)
        $delayedBusesNow = Trip::where('school_id', $schoolId)
            ->whereDate('trip_date', $today)
            ->where('status', 'in_progress')
            ->whereNotNull('arrival_time')
            ->get()
            ->filter(fn($trip) => Carbon::parse($trip->arrival_time)->addMinutes(15)->isPast())
            ->count();

        // Distance covered today
        $distanceToday = Trip::where('school_id', $schoolId)
            ->whereDate('trip_date', $today)
            ->where('status', 'finished')
            ->with('route')
            ->get()
            ->sum(fn($trip) => $trip->route?->estimated_distance_km ?? 0);

        // Zero Incident Days (Days since last delay)
        $lastDelay = Delay::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))->latest()->first();
        $zeroIncidentDays = $lastDelay ? max(0, Carbon::now()->startOfDay()->diffInDays(Carbon::parse($lastDelay->created_at)->startOfDay())) : 30;

        // ─── 4. Attendance Trend (last 7 days) ───────────────────────────────
        $attendanceTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date     = Carbon::now()->subDays($i);
            $dayQuery = Attendance::whereDate('date', $date->format('Y-m-d'))
                ->whereHas('student', fn($q) => $q->inSchool($schoolId));
            $dayTotal   = (clone $dayQuery)->count();
            $dayPresent = (clone $dayQuery)->where('status', 'present')->count();

            $attendanceTrend[] = [
                'date'    => $date->translatedFormat('D'),
                'present' => $dayPresent,
                'absent'  => $dayTotal - $dayPresent,
                'total'   => $dayTotal,
            ];
        }

        // ─── 5. Recent Activities (from recent attendance) ─────────────────────
        $recentActivities = [];

        $recentAttendance = Attendance::whereHas('student', fn($q) => $q->inSchool($schoolId))
            ->with('student')
            ->latest('date')
            ->latest('id')
            ->take(5)
            ->get();

        foreach ($recentAttendance as $att) {
            $recentActivities[] = [
                'id'             => $att->id,
                'type'           => 'attendance',
                'title'          => $att->student->full_name,
                'description_ar' => $att->status === 'present' ? 'تم تسجيل الحضور' : 'تم تسجيل الغياب',
                'description_en' => $att->status === 'present' ? 'Attendance recorded' : 'Absence recorded',
                'time'           => Carbon::parse($att->date)->diffForHumans(),
                'status'         => $att->status,
            ];
        }

        // ─── 6. Students Distribution by Bus ──────────────────────────────────
        $studentsByBus = Student::inSchool($schoolId)
            ->whereNotNull('forth_bus_id')
            ->select('forth_bus_id', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('forth_bus_id')
            ->with('forthBus:id,bus_number,plate_number')
            ->get()
            ->map(function($item) {
                return [
                    'name' => $item->forthBus ? $item->forthBus->display_name : 'Unknown',
                    'value' => (int) $item->total,
                ];
            });

        // ─── 8. Upcoming Holidays ─────────────────────────────────────────────
        $upcomingHolidays = \App\Models\Holiday::where(function ($q) use ($schoolId) {
            $q->whereNull('school_id')->orWhere('school_id', $schoolId);
        })
            ->where('end_date', '>=', $today)
            ->orderBy('start_date', 'asc')
            ->take(5)
            ->get();

        // ─── Render ───────────────────────────────────────────────────────────
        return Inertia::render('School/Dashboard', [
            'stats' => [
                // Inventory (kept for context, displayed compactly)
                'students'               => $studentsCount,
                'classes'                => $classesCount,
                'buses'                  => $totalBuses,
                'active_buses'           => $activeBuses,
                'routes'                 => $routesCount,
                'teachers'               => $teachersCount,
                // School-level attendance
                'attendance_percentage'    => $attendancePercentage,
                'attendance_today_count'   => $totalAttendanceRecords,
            ],
            // ✅ Operational KPIs — the advanced live cards
            'transport' => [
                'completed_trips_today'      => $completedTripsToday,
                'total_trips_today'          => $totalTripsToday,
                'active_trips_now'           => $activeTripsNow,
                'students_transported_today' => $studentsTransportedToday,
                'trip_success_rate'          => $tripSuccessRate,
                'active_buses'               => $activeBuses,
                'total_buses'                => $totalBuses,
                'delayed_buses_now'          => $delayedBusesNow,
                'delays_this_month'          => $delaysThisMonth,
                'distance_today'             => $distanceToday,
                'zero_incident_days'         => $zeroIncidentDays,
            ],
            'attendanceTrend'    => $attendanceTrend,
            'studentsByBus'      => $studentsByBus,
            'recentActivities'   => $recentActivities,
            'upcomingHolidays'   => $upcomingHolidays,
            'system_status'      => 'operational',
        ]);
    }
}
