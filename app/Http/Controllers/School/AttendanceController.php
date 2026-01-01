<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    /**
     * Daily attendance viewer
     */
    public function index(Request $request)
    {
        $schoolId = Auth::user()->school_id;

        $date = $request->query('date')
            ? Carbon::parse($request->query('date'))->toDateString()
            : Carbon::today()->toDateString();

        // طلاب المدرسة (المُلتحقين حالياً)
        $students = Student::query()
            ->whereHas('enrollments', function ($q) use ($schoolId) {
                $q->where('school_id', $schoolId)->where('is_active', true);
            })
            ->with(['currentEnrollment.classroom:id,name'])
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'student_code']);



        return Inertia::render('School/Attendance/Index', [
            'date' => $date,
            'students' => $students,
        ]);
    }

    /**
     * Save daily attendance (bulk)
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $schoolId = $user->school_id;

        $validated = $request->validate([
            'date' => 'required|date',
            'rows' => 'required|array',
            'rows.*.student_id' => 'required|integer|exists:students,id',
            'rows.*.status' => ['required', Rule::in(['present', 'absent'])],
        ]);

        $date = Carbon::parse($validated['date'])->toDateString();

        // فقط طلاب المدرسة
        $allowedStudentIds = Student::query()
            ->whereHas('enrollments', function ($q) use ($schoolId) {
                $q->where('school_id', $schoolId)->where('is_active', true);
            })
            ->pluck('id')
            ->all();

        $allowedStudentIds = array_flip($allowedStudentIds);

        DB::transaction(function () use ($validated, $date, $schoolId, $user, $allowedStudentIds) {
            foreach ($validated['rows'] as $row) {
                if (!isset($allowedStudentIds[$row['student_id']])) {
                    continue;
                }

                
            }
        });

        return redirect()->back()->with('success', 'Attendance saved successfully.');
    }
}
