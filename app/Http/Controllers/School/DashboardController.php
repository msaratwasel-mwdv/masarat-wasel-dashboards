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
        $schoolId = Auth::user()->school_id;

        // 1. Basic Stats
        $studentsCount = Student::where('school_id', $schoolId)->count();
        $classesCount = Classroom::where('school_id', $schoolId)->count();
        
        // Supervisors/Teachers (assuming they have role 'school_admin' or similar, or just users in school excluding current one?)
        // For now, let's count users in the school who are NOT the current user generally, or better, leverage TeacherController logic if existing.
        // TeacherController logic used: User::where('school_id', $schoolId)->whereHas('roles', fn($q) => $q->where('name', 'teacher'))...
        // Let's assume 'teacher' or 'supervisor' role. Let's count all users in school for now as simplified staff.
        $staffCount = User::where('school_id', $schoolId)->count(); 

        // 2. Attendance Stats (Today)
        $today = now()->format('Y-m-d');
        $attendanceQuery = Attendance::whereDate('date', $today)
            ->whereHas('student', fn($q) => $q->where('school_id', $schoolId));
        
        $totalAttendanceRecords = $attendanceQuery->count();
        $presentCount = $attendanceQuery->where('status', 'present')->count();
        
        $attendancePercentage = $totalAttendanceRecords > 0 
            ? round(($presentCount / $totalAttendanceRecords) * 100, 1) 
            : 0;

        // 3. Recent Activity (Last 5 events - e.g. new students or attendance)
        // Let's just show recent students for now
        $recentStudents = Student::where('school_id', $schoolId)
            ->latest()
            ->take(5)
            ->get(['id', 'full_name', 'created_at', 'image']);

        return Inertia::render('School/Dashboard', [
            'stats' => [
                'students' => $studentsCount,
                'classes' => $classesCount,
                'staff' => $staffCount,
                'attendance_percentage' => $attendancePercentage,
                'attendance_today_count' => $totalAttendanceRecords
            ],
            'recent_students' => $recentStudents,
            'system_status' => 'operational' // Mocking system status
        ]);
    }
}
