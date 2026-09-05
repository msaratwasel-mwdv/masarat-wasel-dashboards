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
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $schoolId = Auth::user()->getSchoolId();
        $today = now()->format('Y-m-d');
        $weekAgo = Carbon::now()->subDays(7);

        // ─── 1. Inventory Counts (needed for context only) ────────────────────
        $studentsCount = Student::inSchool($schoolId)->count();
        $classesCount = Classroom::atSchool($schoolId)->count();
        $totalBuses = \App\Models\Bus::where('school_id', $schoolId)->count();
        $activeBuses = \App\Models\Bus::where('school_id', $schoolId)->where('status', 'active')->count();
        $routesCount = \App\Models\Route::where('school_id', $schoolId)->count();
        $teachersCount = \App\Models\Teacher::where('school_id', $schoolId)->count();

        // ─── 2. Today's Attendance (school-level) ────────────────────────────
        $attendanceQuery = Attendance::whereDate('date', $today)
            ->whereHas('student', fn ($q) => $q->inSchool($schoolId));
        $totalAttendanceRecords = (clone $attendanceQuery)->count();
        $presentCount = (clone $attendanceQuery)->where('status', 'present')->count();
        $attendancePercentage = $totalAttendanceRecords > 0
            ? round(($presentCount / $totalAttendanceRecords) * 100, 1)
            : 0;

        // ─── 3. Operational KPIs — TRANSPORT (today) ─────────────────────────

        // All trip types: 'morning', 'forth', 'back'
        $todayTripsQuery = Trip::where('school_id', $schoolId)->whereDate('trip_date', $today);
        $totalTripsToday = (clone $todayTripsQuery)->count();
        $completedTripsToday = (clone $todayTripsQuery)->where('status', 'finished')->count();

        // Students who actually boarded a bus today
        $studentsTransportedToday = TripAttendance::whereHas(
            'trip',
            fn ($q) => $q->where('school_id', $schoolId)->whereDate('trip_date', $today)
        )
            ->whereNotNull('check_in_time')
            ->distinct('student_id')
            ->count('student_id');

        // Trip success rate — last 7 days
        $tripsWeekTotal = Trip::where('school_id', $schoolId)
            ->where('trip_date', '>=', $weekAgo)->count();
        $tripsWeekFinished = Trip::where('school_id', $schoolId)
            ->where('trip_date', '>=', $weekAgo)
            ->where('status', 'finished')->count();
        $tripSuccessRate = $tripsWeekTotal > 0
            ? round(($tripsWeekFinished / $tripsWeekTotal) * 100, 1)
            : 0;

        // Delays this month (via bus → school_id)
        $delaysThisMonth = Delay::whereHas(
            'bus',
            fn ($q) => $q->where('school_id', $schoolId)
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
            ->filter(fn ($trip) => Carbon::parse($trip->arrival_time)->addMinutes(15)->isPast())
            ->count();

        // Distance covered today
        $distanceToday = Trip::where('school_id', $schoolId)
            ->whereDate('trip_date', $today)
            ->where('status', 'finished')
            ->with('route')
            ->get()
            ->sum(fn ($trip) => $trip->route?->estimated_distance_km ?? 0);

        // Zero Incident Days (Days since last delay)
        $lastDelay = Delay::whereHas('bus', fn ($q) => $q->where('school_id', $schoolId))->latest()->first();
        $zeroIncidentDays = $lastDelay ? max(0, Carbon::now()->startOfDay()->diffInDays(Carbon::parse($lastDelay->created_at)->startOfDay())) : 30;

        // ─── 4. Attendance Trend (last 7 days) ───────────────────────────────
        $attendanceTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dayQuery = Attendance::whereDate('date', $date->format('Y-m-d'))
                ->whereHas('student', fn ($q) => $q->inSchool($schoolId));
            $dayTotal = (clone $dayQuery)->count();
            $dayPresent = (clone $dayQuery)->where('status', 'present')->count();

            $attendanceTrend[] = [
                'date' => $date->format('Y-m-d'),
                'day_ar' => $date->copy()->locale('ar')->translatedFormat('D'),
                'day_en' => $date->copy()->locale('en')->translatedFormat('D'),
                'present' => $dayPresent,
                'absent' => $dayTotal - $dayPresent,
                'total' => $dayTotal,
            ];
        }

        // ─── 5. Operational Shift & Context ──────────────────────────────────
        $hour = (int) now('Asia/Riyadh')->format('H');
        if ($hour >= 6 && $hour < 9) {
            $shift = [
                'key' => 'morning_pickup',
                'label_ar' => 'فترة الانطلاق والوصول الصباحي',
                'label_en' => 'Morning Pickup & Arrival Shift',
                'description_ar' => 'الحافلات تنقل الطلاب إلى المدرسة حالياً',
                'description_en' => 'Buses are in transit delivering students to school',
                'status_tone' => 'emerald',
                'next_event_ar' => 'اكتمال الوصول بحلول 07:45 ص',
                'next_event_en' => 'Estimated arrival completion by 07:45 AM',
            ];
        } elseif ($hour >= 9 && $hour < 12) {
            $shift = [
                'key' => 'in_school',
                'label_ar' => 'الفترة المدرسية (داخل الفصول)',
                'label_en' => 'School In-Session',
                'description_ar' => 'الأسطول في وضع الانتظار بانتظار موعد الانصراف',
                'description_en' => 'Fleet is parked on standby for afternoon dismissal',
                'status_tone' => 'blue',
                'next_event_ar' => 'انطلاق رحلات العودة في 12:45 م',
                'next_event_en' => 'Dismissal trips launch at 12:45 PM',
            ];
        } elseif ($hour >= 12 && $hour < 16) {
            $shift = [
                'key' => 'afternoon_dropoff',
                'label_ar' => 'فترة الانصراف والعودة للمنازل',
                'label_en' => 'Afternoon Dismissal & Drop-off',
                'description_ar' => 'الحافلات تنقل الطلاب من المدرسة إلى منازلهم',
                'description_en' => 'Buses are actively returning students to their homes',
                'status_tone' => 'emerald',
                'next_event_ar' => 'اكتمال توصيل جميع الطلاب بحلول 02:30 م',
                'next_event_en' => 'Estimated dropoff completion by 02:30 PM',
            ];
        } else {
            $shift = [
                'key' => 'standby',
                'label_ar' => 'فترة الاستعداد والجاهزية للغد',
                'label_en' => 'Fleet Standby & Night Readiness',
                'description_ar' => 'جميع الحافلات متوقفة وجاهزة لانطلاق الرحلة الصباحية',
                'description_en' => 'All buses parked in standby for morning route dispatch (06:30 AM)',
                'status_tone' => 'slate',
                'next_event_ar' => 'انطلاق الرحلة الصباحية القادمة في 06:30 ص',
                'next_event_en' => 'Next morning dispatch at 06:30 AM',
            ];
        }

        // ─── 6. Detailed Fleet Status ────────────────────────────────────────
        $fleet = \App\Models\Bus::where('school_id', $schoolId)
            ->with([
                'driver.user:id,first_name_ar,last_name_ar,first_name_en,last_name_en,phone,image',
                'assistant:id,first_name_ar,last_name_ar,first_name_en,last_name_en,phone,image',
                'route:id,name,code,estimated_distance_km',
            ])
            ->get()
            ->map(function ($bus) use ($schoolId) {
                $assignedCount = Student::inSchool($schoolId)
                    ->where(fn ($q) => $q->where('forth_bus_id', $bus->id)->orWhere('back_bus_id', $bus->id))
                    ->count();

                return [
                    'id' => $bus->id,
                    'bus_number' => $bus->bus_number,
                    'plate_number' => $bus->plate_number,
                    'model' => $bus->model,
                    'year' => $bus->year,
                    'capacity' => $bus->capacity ?: 24,
                    'status' => $bus->status,
                    'assigned_students_count' => $assignedCount,
                    'occupancy_rate' => $bus->capacity > 0 ? round(($assignedCount / $bus->capacity) * 100, 1) : 0,
                    'route' => $bus->route ? [
                        'id' => $bus->route->id,
                        'name' => $bus->route->name,
                        'code' => $bus->route->code,
                        'distance_km' => $bus->route->estimated_distance_km,
                    ] : null,
                    'driver' => $bus->driver?->user ? [
                        'name' => $bus->driver->user->name,
                        'phone' => $bus->driver->user->phone,
                    ] : null,
                    'assistant' => $bus->assistant ? [
                        'name' => $bus->assistant->name,
                        'phone' => $bus->assistant->phone,
                    ] : null,
                ];
            });

        // ─── 7. Student Transport Pulse & Manifest ────────────────────────────
        $assignedStudentsCount = Student::inSchool($schoolId)
            ->where(fn ($q) => $q->whereNotNull('forth_bus_id')->orWhereNotNull('back_bus_id'))
            ->count();
        $unassignedStudentsCount = max(0, $studentsCount - $assignedStudentsCount);

        $studentManifest = Student::inSchool($schoolId)
            ->with([
                'currentEnrollment.classroom:id,name',
                'forthBus:id,bus_number,plate_number',
                'guardians:id,first_name_ar,last_name_ar,first_name_en,last_name_en,phone',
            ])
            ->take(12)
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'name' => $s->full_name,
                    'national_id' => $s->national_id,
                    'classroom' => $s->currentEnrollment?->classroom?->name ?? 'غير محدد',
                    'is_assigned' => (bool) ($s->forth_bus_id || $s->back_bus_id),
                    'bus_number' => $s->forthBus?->bus_number ?? '—',
                    'plate_number' => $s->forthBus?->plate_number ?? '—',
                    'guardian_name' => $s->guardians->first()?->name ?? '—',
                    'guardian_phone' => $s->guardians->first()?->phone ?? '—',
                ];
            });

        // ─── 8. Operational Attention Items ──────────────────────────────────
        $hasCalendar = \App\Models\AcademicCalendar::where('school_id', $schoolId)
            ->where('is_active', true)
            ->exists();

        $pendingAbsences = \App\Models\AbsenceRequest::whereHas('student', fn ($q) => $q->inSchool($schoolId))
            ->where('status', 'pending')
            ->with('student:id,first_name_ar,last_name_ar,first_name_en,last_name_en')
            ->latest()
            ->take(4)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'student_name' => $r->student?->full_name,
                'start_date' => $r->start_date,
                'end_date' => $r->end_date,
                'reason' => $r->reason,
            ]);

        $pendingLocations = \App\Models\StudentLocationRequest::whereHas('student', fn ($q) => $q->inSchool($schoolId))
            ->where('status', 'pending')
            ->with('student:id,first_name_ar,last_name_ar,first_name_en,last_name_en')
            ->latest()
            ->take(4)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'student_name' => $r->student?->full_name,
                'address' => $r->new_address ?? $r->notes,
            ]);

        $busesMissingCrew = $fleet->filter(fn ($b) => ! $b['driver'] || ! $b['assistant'])->count();

        $attentionItems = [
            'has_calendar' => $hasCalendar,
            'unassigned_students_count' => $unassignedStudentsCount,
            'pending_absences_count' => $pendingAbsences->count(),
            'pending_absences' => $pendingAbsences,
            'pending_locations_count' => $pendingLocations->count(),
            'pending_locations' => $pendingLocations,
            'buses_missing_crew_count' => $busesMissingCrew,
        ];

        // ─── 9. Recent Operations Stream (100% Real Database Events) ────────
        $recentActivities = [];

        // Real Attendance Events
        $recentAttendance = Attendance::whereHas('student', fn ($q) => $q->inSchool($schoolId))
            ->with('student')
            ->latest('date')
            ->latest('id')
            ->take(5)
            ->get();

        foreach ($recentAttendance as $att) {
            $studentNameAr = $att->student?->full_name ?: 'طالب مسجل';
            $studentNameEn = $att->student?->name_en ?: $studentNameAr;
            $recentActivities[] = [
                'id' => 'att-'.$att->id,
                'type' => 'attendance',
                'title' => $studentNameAr,
                'title_ar' => $studentNameAr,
                'title_en' => $studentNameEn,
                'description_ar' => $att->status === 'present' ? 'تم تسجيل حضور الطالب' : 'تم تسجيل غياب الطالب',
                'description_en' => $att->status === 'present' ? 'Student attendance confirmed' : 'Student absence recorded',
                'time_ar' => Carbon::parse($att->date)->locale('ar')->diffForHumans(),
                'time_en' => Carbon::parse($att->date)->locale('en')->diffForHumans(),
                'time' => Carbon::parse($att->date)->diffForHumans(),
                'status' => $att->status,
            ];
        }

        // Real Trips Events
        $recentTrips = \App\Models\Trip::where('school_id', $schoolId)
            ->with(['route:id,name', 'bus:id,bus_number'])
            ->latest('id')
            ->take(4)
            ->get();

        foreach ($recentTrips as $trip) {
            $routeNameAr = $trip->route?->name ?: ($trip->bus ? ('حافلة '.$trip->bus->bus_number) : 'رحلة مدرسية');
            $routeNameEn = $trip->route?->name ?: ($trip->bus ? ('Bus #'.$trip->bus->bus_number) : 'School Trip');
            $recentActivities[] = [
                'id' => 'trip-'.$trip->id,
                'type' => 'trip',
                'title' => $routeNameAr,
                'title_ar' => $routeNameAr,
                'title_en' => $routeNameEn,
                'description_ar' => $trip->status === 'completed' ? 'اكتملت الرحلة بنجاح' : ($trip->status === 'in_progress' ? 'الرحلة جارية حالياً' : 'رحلة مجدولة بالمسار'),
                'description_en' => $trip->status === 'completed' ? 'Trip completed successfully' : ($trip->status === 'in_progress' ? 'Trip in progress' : 'Scheduled route trip'),
                'time_ar' => $trip->created_at ? $trip->created_at->locale('ar')->diffForHumans() : 'اليوم',
                'time_en' => $trip->created_at ? $trip->created_at->locale('en')->diffForHumans() : 'Today',
                'time' => $trip->created_at ? $trip->created_at->diffForHumans() : 'Today',
                'status' => $trip->status,
            ];
        }

        // Real Absence Requests Events
        $recentAbsences = \App\Models\AbsenceRequest::whereHas('student', fn ($q) => $q->inSchool($schoolId))
            ->with('student')
            ->latest('id')
            ->take(3)
            ->get();

        foreach ($recentAbsences as $abs) {
            $stNameAr = $abs->student?->full_name ?: 'طلب غياب';
            $stNameEn = $abs->student?->name_en ?: $stNameAr;
            $recentActivities[] = [
                'id' => 'abs-'.$abs->id,
                'type' => 'absence',
                'title' => $stNameAr,
                'title_ar' => $stNameAr,
                'title_en' => $stNameEn,
                'description_ar' => 'طلب إذن غياب: '.($abs->reason ?: 'عذر مسبق'),
                'description_en' => 'Absence request: '.($abs->reason ?: 'Excused absence notice'),
                'time_ar' => $abs->created_at ? $abs->created_at->locale('ar')->diffForHumans() : 'اليوم',
                'time_en' => $abs->created_at ? $abs->created_at->locale('en')->diffForHumans() : 'Today',
                'time' => $abs->created_at ? $abs->created_at->diffForHumans() : 'Today',
                'status' => $abs->status,
            ];
        }

        // Real Student Location Requests Events
        $recentLocations = \App\Models\StudentLocationRequest::where('school_id', $schoolId)
            ->with('student')
            ->latest('id')
            ->take(3)
            ->get();

        foreach ($recentLocations as $loc) {
            $stNameAr = $loc->student?->full_name ?: 'طلب موقع';
            $stNameEn = $loc->student?->name_en ?: 'Location Update';
            $recentActivities[] = [
                'id' => 'loc-'.$loc->id,
                'type' => 'location',
                'title' => $stNameAr,
                'title_ar' => $stNameAr,
                'title_en' => $stNameEn,
                'description_ar' => 'طلب تحديث موقع الطالب',
                'description_en' => 'Student location update request',
                'time_ar' => $loc->created_at ? $loc->created_at->locale('ar')->diffForHumans() : 'اليوم',
                'time_en' => $loc->created_at ? $loc->created_at->locale('en')->diffForHumans() : 'Today',
                'time' => $loc->created_at ? $loc->created_at->diffForHumans() : 'Today',
                'status' => $loc->status,
            ];
        }

        // ─── 10. Students Distribution by Bus ─────────────────────────────────
        $studentsByBus = Student::inSchool($schoolId)
            ->whereNotNull('forth_bus_id')
            ->select('forth_bus_id', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('forth_bus_id')
            ->with('forthBus:id,bus_number,plate_number')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->forthBus ? $item->forthBus->display_name : 'غير محدد',
                    'value' => (int) $item->total,
                ];
            });

        // ─── 11. Upcoming Holidays & Events ────────────────────────────────────
        $upcomingHolidays = \App\Models\Holiday::where(function ($q) use ($schoolId) {
            $q->whereNull('school_id')->orWhere('school_id', $schoolId);
        })
            ->where('end_date', '>=', $today)
            ->orderBy('start_date', 'asc')
            ->take(4)
            ->get();

        $school = \App\Models\School::find($schoolId);

        // ─── Render ───────────────────────────────────────────────────────────
        return Inertia::render('School/Dashboard', [
            'school' => $school ? [
                'id' => $school->id,
                'name' => $school->name,
                'code' => $school->code,
            ] : null,
            'shift' => $shift,
            'fleet' => $fleet,
            'studentPulse' => [
                'total_enrolled' => $studentsCount,
                'assigned_to_transport' => $assignedStudentsCount,
                'unassigned_students' => $unassignedStudentsCount,
                'manifest' => $studentManifest,
            ],
            'attentionItems' => $attentionItems,
            'stats' => [
                'students' => $studentsCount,
                'classes' => $classesCount,
                'buses' => $totalBuses,
                'active_buses' => $activeBuses,
                'routes' => $routesCount,
                'teachers' => $teachersCount,
                'attendance_percentage' => $attendancePercentage,
                'attendance_today_count' => $totalAttendanceRecords,
            ],
            'transport' => [
                'completed_trips_today' => $completedTripsToday,
                'total_trips_today' => $totalTripsToday,
                'active_trips_now' => $activeTripsNow,
                'students_transported_today' => $studentsTransportedToday,
                'trip_success_rate' => $tripSuccessRate,
                'active_buses' => $activeBuses,
                'total_buses' => $totalBuses,
                'delayed_buses_now' => $delayedBusesNow,
                'delays_this_month' => $delaysThisMonth,
                'distance_today' => $distanceToday,
                'zero_incident_days' => $zeroIncidentDays,
            ],
            'attendanceTrend' => $attendanceTrend,
            'studentsByBus' => $studentsByBus,
            'recentActivities' => $recentActivities,
            'upcomingHolidays' => $upcomingHolidays,
            'system_status' => 'operational',
        ]);
    }
}
