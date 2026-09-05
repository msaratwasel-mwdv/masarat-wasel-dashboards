<?php

namespace App\Http\Controllers\School\Attendance;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Student; // Enforce Classroom Model
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AttendanceController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $schoolId = Auth::user()->getSchoolId();
        $search = $request->input('search', $request->input('student_national_id'));

        $query = Attendance::whereHas('student', function ($q) use ($schoolId) {
            $q->inSchool($schoolId);
        })->with([
            'student.guardian:id,first_name_ar,last_name_ar,phone,national_id',
            'student.currentEnrollment.classroom',
            'student:id,first_name_ar,last_name_ar,national_id,student_code',
            'classroom.teachers.user:id,first_name_ar,last_name_ar,first_name_en,last_name_en',
            'classroom.teacher:id,first_name_ar,last_name_ar,first_name_en,last_name_en',
        ]);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('classroom_id')) {
            $query->where('classroom_id', $request->classroom_id);
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        // Filter by date range
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        if ($startDate && $endDate) {
            $query->whereDate('date', '>=', $startDate)
                ->whereDate('date', '<=', $endDate);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Universal search matching StudentController (name, code, civil ID, guardian)
        if ($search) {
            $query->whereHas('student', function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('first_name_ar', 'like', "%{$search}%")
                        ->orWhere('last_name_ar', 'like', "%{$search}%")
                        ->orWhere('student_code', 'like', "%{$search}%")
                        ->orWhere('national_id', 'like', "%{$search}%")
                        ->orWhereHas('guardians', function ($g) use ($search) {
                            $g->where('first_name_ar', 'like', "%{$search}%")
                                ->orWhere('national_id', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%");
                        });
                });
            });
        }

        $allRecords = (clone $query)->orderBy('date', 'desc')->get();
        $total = $allRecords->count();
        $present = $allRecords->where('status', 'present')->count();
        $absent = $allRecords->where('status', 'absent')->count();

        $stats = [
            'total' => $total,
            'present' => $present,
            'absent' => $absent,
        ];

        if ($request->wantsJson() && ! $request->hasHeader('X-Inertia')) {
            return response()->json($allRecords->take(500)->values());
        }

        $classrooms = Classroom::atSchool($schoolId)->orderBy('name')->get(['id', 'name']);

        return \Inertia\Inertia::render('School/Attendance/AttendanceReports', [
            'attendance' => $allRecords->take(500)->values(),
            'classrooms' => $classrooms,
            'filters' => [
                'search' => $search ?? '',
                'classroom_id' => $request->input('classroom_id', ''),
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $request->input('status', 'all'),
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'classroom_id' => 'required|exists:classrooms,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent',
        ]);

        // Verify student belongs to same school
        $student = Student::where('id', $request->student_id)
            ->inSchool(Auth::user()->getSchoolId())
            ->firstOrFail();

        // Check if attendance already exists for this student on this date
        $existing = Attendance::where('student_id', $request->student_id)
            ->where('date', $request->date)
            ->first();

        if ($existing) {
            // Update existing attendance
            $existing->update([
                'status' => $request->status,
                'classroom_id' => $request->classroom_id,
            ]);
            $this->sendAttendanceNotification($request->student_id, $request->status);

            return response()->json($existing->load(['student', 'classroom']), 200);
        }

        $attendance = Attendance::create([
            'student_id' => $request->student_id,
            'classroom_id' => $request->classroom_id,
            'date' => $request->date,
            'status' => $request->status,
        ]);

        $this->sendAttendanceNotification($request->student_id, $request->status);

        return response()->json($attendance->load(['student', 'classroom']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $attendance = Attendance::with(['student', 'classroom'])->findOrFail($id);

        return response()->json($attendance);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $schoolId = Auth::user()->getSchoolId();
        $attendance = Attendance::whereHas('student', function ($q) use ($schoolId) {
            $q->inSchool($schoolId);
        })->findOrFail($id);

        $request->validate([
            'status' => 'sometimes|in:present,absent',
            'date' => 'sometimes|date',
            'classroom_id' => 'sometimes|nullable|exists:classrooms,id',
        ]);

        $attendance->update($request->only(['status', 'date', 'classroom_id']));

        if ($request->has('status')) {
            $this->sendAttendanceNotification($attendance->student_id, $request->status);
        }

        return response()->json($attendance->load(['student', 'classroom']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $schoolId = Auth::user()->getSchoolId();
        $attendance = Attendance::whereHas('student', function ($q) use ($schoolId) {
            $q->inSchool($schoolId);
        })->findOrFail($id);
        $attendance->delete();

        return response()->json(['message' => 'Attendance record deleted']);
    }

    /**
     * Bulk update attendance for a class on a specific date
     */
    public function bulkStore(Request $request)
    {
        $request->validate([
            'classroom_id' => 'nullable|exists:classrooms,id',
            'date' => 'required|date',
            'attendance' => 'required|array',
            'attendance.*.student_id' => 'required|exists:students,id',
            'attendance.*.status' => 'required|in:present,absent',
            'attendance.*.classroom_id' => 'nullable|exists:classrooms,id',
        ]);

        $results = [];
        foreach ($request->attendance as $item) {
            // Determine classroom ID: Item > Request > Student's Current
            $classId = $item['classroom_id'] ?? $request->classroom_id;

            if (! $classId) {
                $student = Student::with('currentEnrollment')->find($item['student_id']);
                $classId = $student->currentEnrollment->classroom_id ?? null;
            }

            if (! $classId) {
                continue;
            } // Skip if no class associated

            $existing = Attendance::where('student_id', $item['student_id'])
                ->where('date', $request->date)
                ->first();

            if ($existing) {
                $existing->update([
                    'status' => $item['status'],
                    'classroom_id' => $classId,
                ]);
                $results[] = $existing;
            } else {
                $results[] = Attendance::create([
                    'student_id' => $item['student_id'],
                    'classroom_id' => $classId,
                    'date' => $request->date,
                    'status' => $item['status'],
                ]);
            }

            // إرسال إشعار لولي الأمر
            $this->sendAttendanceNotification($item['student_id'], $item['status']);
        }

        return response()->json($results, 201);
    }

    /**
     * إرسال إشعار لولي أمر الطالب عند تسجيل الحضور/الغياب
     */
    protected function sendAttendanceNotification(int $studentId, string $status): void
    {
        try {
            $student = Student::with('guardians')->find($studentId);
            if (! $student || $student->guardians->isEmpty()) {
                return;
            }

            $statusAr = match ($status) {
                'present' => 'حاضراً',
                'absent' => 'غائباً',
                'late' => 'متأخراً',
                'excused' => 'معذوراً',
                default => $status,
            };

            $statusEn = match ($status) {
                'present' => 'present',
                'absent' => 'absent',
                'late' => 'late',
                'excused' => 'excused',
                default => $status,
            };

            // بث حدث WebSocket لتحديث واجهة ولي الأمر فوراً
            event(new \App\Events\TeacherAttendanceMarked($student, $status, today()->toDateString()));

            foreach ($student->guardians as $guardian) {
                $this->notificationService->sendTranslatedToUser(
                    userId: $guardian->id,
                    type: 'school_attendance',
                    titleKey: 'notifications.school_attendance_title',
                    messageKey: 'notifications.school_attendance_message',
                    translationParams: [
                        'student' => $student->full_name,
                        'status' => $statusAr,
                    ],
                    data: [
                        'student_id' => (string) $student->id,
                        'student_name' => $student->full_name,
                        'student_name_en' => $student->full_name_en,
                        'status' => $status,
                        'date' => today()->toDateString(),
                        'category' => 'attendance',
                        'target_screen' => 'attendance_details',
                    ],
                    translationParamsEn: [
                        'student' => $student->full_name_en ?: $student->full_name,
                        'status' => $statusEn,
                    ]
                );
            }

            \Log::info("[SchoolAttendance] Notification sent to guardians of Student: {$student->id} ({$student->full_name}) - Status: {$status}");
        } catch (\Throwable $e) {
            \Log::error("[SchoolAttendance] Failed to send notification for Student {$studentId}: ".$e->getMessage());
        }
    }
}
