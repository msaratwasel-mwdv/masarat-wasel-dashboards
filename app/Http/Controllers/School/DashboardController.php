<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\User; // Assuming Supervisors are Users
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $schoolId = Auth::user()->getSchoolId();

        // 1. Basic Stats
        $studentsCount = Student::inSchool($schoolId)->count();
        $classesCount = Classroom::where('school_id', $schoolId)->count();
        
        // Buses stats instead of staff
        $totalBuses = \App\Models\Bus::where('school_id', $schoolId)->count();
        $activeBuses = \App\Models\Bus::where('school_id', $schoolId)->where('status', 'active')->count();

        // 2. Attendance Stats (Today)
        $today = now()->format('Y-m-d');
        $attendanceQuery = Attendance::whereDate('date', $today)
            ->whereHas('student', fn($q) => $q->inSchool($schoolId));
        
        $totalAttendanceRecords = $attendanceQuery->count();
        $presentCount = $attendanceQuery->where('status', 'present')->count();
        
        $attendancePercentage = $totalAttendanceRecords > 0 
            ? round(($presentCount / $totalAttendanceRecords) * 100, 1) 
            : 0;

        // 3. Recent Activity (Last 5 events - e.g. new students or attendance)
        // Let's just show recent students for now
        $recentStudents = Student::inSchool($schoolId)
            ->latest()
            ->take(5)
            ->get(['id', 'first_name_ar', 'last_name_ar', 'created_at', 'image']);

        $routesCount = \App\Models\Route::where('school_id', $schoolId)->count();

        return Inertia::render('School/Dashboard', [
            'stats' => [
                'students' => $studentsCount,
                'classes' => $classesCount,
                'buses' => $totalBuses,
                'active_buses' => $activeBuses,
                'routes' => $routesCount,
                'attendance_percentage' => $attendancePercentage,
                'attendance_today_count' => $totalAttendanceRecords,
                'daily_trips_today' => \App\Models\Trip::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
                    ->whereDate('trip_date', $today)
                    ->count(),
            ],
            'recent_students' => $recentStudents,
            'system_status' => 'operational' // Mocking system status
        ]);
    }
}


