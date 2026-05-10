<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Student;
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
        $today = now()->format('Y-m-d');

        // 1. Basic Stats
        $studentsCount = Student::inSchool($schoolId)->count();
        $classesCount = Classroom::atSchool($schoolId)->count();
        $totalBuses = \App\Models\Bus::where('school_id', $schoolId)->count();
        $activeBuses = \App\Models\Bus::where('school_id', $schoolId)->where('status', 'active')->count();
        $routesCount = \App\Models\Route::where('school_id', $schoolId)->count();

        // Teachers count
        $teachersCount = \App\Models\Teacher::where('school_id', $schoolId)->count();

        // Supervisors (field_supervisors assigned to buses in this school)
        $supervisorsCount = \App\Models\Bus::where('school_id', $schoolId)
            ->whereNotNull('field_supervisor_id')
            ->distinct('field_supervisor_id')
            ->count('field_supervisor_id');

        // 2. Attendance Stats (Today)
        $attendanceQuery = Attendance::whereDate('date', $today)
            ->whereHas('student', fn($q) => $q->inSchool($schoolId));

        $totalAttendanceRecords = (clone $attendanceQuery)->count();
        $presentCount = (clone $attendanceQuery)->where('status', 'present')->count();

        $attendancePercentage = $totalAttendanceRecords > 0
            ? round(($presentCount / $totalAttendanceRecords) * 100, 1)
            : 0;

        // Daily trips today
        $dailyTripsToday = \App\Models\Trip::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->whereDate('trip_date', $today)
            ->count();

        // 3. Attendance Trend (Last 7 days)
        $attendanceTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dayAttendance = Attendance::whereDate('date', $date->format('Y-m-d'))
                ->whereHas('student', fn($q) => $q->inSchool($schoolId));
            $dayTotal = (clone $dayAttendance)->count();
            $dayPresent = (clone $dayAttendance)->where('status', 'present')->count();

            $attendanceTrend[] = [
                'date' => $date->translatedFormat('D'),
                'present' => $dayPresent,
                'absent' => $dayTotal - $dayPresent,
                'total' => $dayTotal,
            ];
        }

        // 4. Student Distribution by class
        $classDistribution = Classroom::atSchool($schoolId)
            ->withCount(['students'])
            ->get()
            ->map(fn($c) => [
                'name' => $c->name,
                'value' => $c->students_count,
                'color' => '#' . substr(md5($c->name), 0, 6),
            ])
            ->filter(fn($c) => $c['value'] > 0)
            ->values()
            ->toArray();

        // Fallback colors
        $chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
        foreach ($classDistribution as $idx => &$item) {
            $item['color'] = $chartColors[$idx % count($chartColors)];
        }

        // 5. Recent Students
        $recentStudents = Student::inSchool($schoolId)
            ->latest()
            ->take(5)
            ->get(['id', 'first_name_ar', 'last_name_ar', 'first_name_en', 'last_name_en', 'created_at', 'image']);

        // 6. Recent Activities (build from recent data)
        $recentActivities = [];

        // Recent students as activities
        foreach ($recentStudents->take(3) as $student) {
            $recentActivities[] = [
                'id' => $student->id,
                'type' => 'student',
                'title' => $student->full_name, // Full name handles localization in model
                'description_ar' => 'تم تسجيل طالب جديد',
                'description_en' => 'New student enrolled',
                'time' => $student->created_at ? Carbon::parse($student->created_at)->diffForHumans() : '',
                'status' => 'new',
            ];
        }

        // Recent attendance as activities
        $recentAttendance = Attendance::whereHas('student', fn($q) => $q->inSchool($schoolId))
            ->with('student')
            ->latest('date')
            ->take(3)
            ->get();

        foreach ($recentAttendance as $att) {
            $recentActivities[] = [
                'id' => $att->id,
                'type' => 'attendance',
                'title' => $att->student->full_name,
                'description_ar' => $att->status === 'present' ? 'تم تسجيل الحضور' : 'تم تسجيل الغياب',
                'description_en' => $att->status === 'present' ? 'Attendance recorded' : 'Absence recorded',
                'time' => Carbon::parse($att->date)->diffForHumans(),
                'status' => $att->status,
            ];
        }

        return Inertia::render('School/Dashboard', [
            'stats' => [
                'students' => $studentsCount,
                'classes' => $classesCount,
                'buses' => $totalBuses,
                'active_buses' => $activeBuses,
                'routes' => $routesCount,
                'teachers' => $teachersCount,
                'supervisors' => $supervisorsCount,
                'attendance_percentage' => $attendancePercentage,
                'attendance_today_count' => $totalAttendanceRecords,
                'daily_trips_today' => $dailyTripsToday,
            ],
            'attendanceTrend' => $attendanceTrend,
            'classDistribution' => $classDistribution,
            'recent_students' => $recentStudents,
            'recentActivities' => $recentActivities,
            'system_status' => 'operational',
        ]);
    }
}
