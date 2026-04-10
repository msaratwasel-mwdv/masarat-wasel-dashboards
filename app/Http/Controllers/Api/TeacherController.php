<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\Attendance;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    /**
     * Get all classes assigned to the authenticated teacher.
     */
    public function getClasses(Request $request)
    {
        $teacher = $request->user();
        
        $classes = $teacher->classrooms()->withCount('students')->get();
        
        $result = $classes->map(function ($cls) use ($teacher) {
            return [
                'id' => (string) $cls->id,
                'name' => $cls->name ?? 'غير معروف',
                'grade' => $cls->grade_level ?? 'غير مسجل',
                'studentCount' => $cls->students_count ?? 0,
                'teacherId' => (string) $teacher->id,
            ];
        });

        return response()->json($result);
    }

    /**
     * Get all students for a specific classroom.
     */
    public function getStudents(Request $request, $classId)
    {
        $students = Student::with('guardian')->whereHas('enrollments', function ($q) use ($classId) {
            $q->where('classroom_id', $classId)->where('is_active', true);
        })->get();
        
        $students = $students->map(function ($student) use ($classId) {
            // Find today's attendance if exists
            $attendance = Attendance::where('student_id', $student->id)
                ->where('classroom_id', $classId)
                ->whereDate('date', today())
                ->first();

            $photoUrl = null;
            if ($student->image) {
                $photoUrl = url('storage/' . ltrim($student->image, '/'));
            } elseif ($student->guardian && $student->guardian->image) {
                $photoUrl = url('storage/' . ltrim($student->guardian->image, '/'));
            }

            return [
                'id' => (string) $student->id,
                'name' => $student->full_name ?? ($student->full_name_en ?? 'غير معروف'),
                'parentName' => $student->guardian ? $student->guardian->name : 'غير محدد',
                'parentPhone' => $student->guardian ? $student->guardian->phone : 'غير محدد',
                'photoUrl' => $photoUrl,
                'status' => $attendance ? $attendance->status : 'unknown',
            ];
        });

        return response()->json($students);
    }

    /**
     * Mark attendance for a specific student.
     */
    public function markAttendance(Request $request, $studentId)
    {
        $request->validate([
            'status' => 'required|in:present,absent,late,excused,unknown',
        ]);

        // Find student by ID, code, or national ID to support various QR/card formats
        $student = Student::with('enrollments')
            ->where('id', $studentId)
            ->orWhere('student_code', $studentId)
            ->orWhere('national_id', $studentId)
            ->firstOrFail();
        $enrollment = $student->currentEnrollment;
        if (!$enrollment) {
            return response()->json(['message' => 'Student not enrolled in any active class'], 400);
        }

        $attendance = Attendance::updateOrCreate(
            [
                'student_id' => $studentId,
                'classroom_id' => $enrollment->classroom_id,
                'date' => today(),
            ],
            [
                'status' => $request->status,
                'recorded_by' => $request->user()->id,
            ]
        );

        if ($student->guardian_id) {
            \Log::info("Broadcasting attendance update for Student: {$student->id}, Guardian: {$student->guardian_id}");
            event(new \App\Events\TeacherAttendanceMarked($student, $request->status, today()->toDateString()));

            // ── إرسال إشعار FCM Push + حفظ في قاعدة البيانات ──
            $statusAr = match ($request->status) {
                'present' => 'حاضراً',
                'absent'  => 'غائباً',
                'late'    => 'متأخراً',
                'excused' => 'معذوراً',
                default   => $request->status,
            };

            $this->notificationService->notifyStudentGuardian(
                studentId: $student->id,
                type: 'school_attendance',
                title: 'تحديث سجل الحضور المدرسي',
                message: "تم تسجيل {$student->full_name} {$statusAr} اليوم.",
                data: [
                    'student_id'   => (string) $student->id,
                    'student_name' => $student->full_name,
                    'status'       => $request->status,
                    'date'         => today()->toDateString(),
                ]
            );
        } else {
            \Log::warning("No guardian assigned for student: {$student->id}, skipping broadcast.");
        }

        return response()->json(['message' => 'Attendance marked successfully', 'attendance' => $attendance]);
    }

    /**
     * Get attendance history for a specific classroom by month.
     */
    public function getClassAttendanceHistory(Request $request, $classId)
    {
        $request->validate([
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $year = $request->year;
        $month = str_pad($request->month, 2, '0', STR_PAD_LEFT);

        // Fetch students to know total
        $classroom = Classroom::with('students.guardian')->findOrFail($classId);
        $students = $classroom->students;
        $totalStudents = $students->count();

        // Fetch attendance records for the month, ordered by newest first
        $attendances = Attendance::with('student.guardian')
            ->where('classroom_id', $classId)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->orderBy('date', 'desc')
            ->get();

        $dailyRecords = [];

        $groupedByDate = $attendances->groupBy(function($item) {
            return \Carbon\Carbon::parse($item->date)->format('Y-m-d');
        });

        foreach ($groupedByDate as $date => $records) {
            $presentCount = $records->whereIn('status', ['present', 'late'])->count();
            $absentCount = $records->whereIn('status', ['absent', 'excused'])->count();
            
            $attendedStudents = $records->map(function($record) {
                $student = $record->student;
                
                $photoUrl = null;
                if ($student) {
                    if ($student->image) {
                        $photoUrl = url('storage/' . ltrim($student->image, '/'));
                    } elseif ($student->guardian && $student->guardian->image) {
                        $photoUrl = url('storage/' . ltrim($student->guardian->image, '/'));
                    }
                }

                return [
                    'id' => (string) $record->student_id,
                    'name' => $student ? ($student->full_name ?? ($student->full_name_en ?? 'غير معروف')) : 'غير معروف',
                    'parentName' => $student && $student->guardian ? $student->guardian->name : 'غير محدد',
                    'parentPhone' => $student && $student->guardian ? $student->guardian->phone : 'غير محدد',
                    'photoUrl' => $photoUrl,
                    'status' => $record->status,
                ];
            })->values()->all();

            $dailyRecords[] = [
                'date' => $date, // YYYY-MM-DD
                'totalStudents' => $totalStudents,
                'presentCount' => $presentCount,
                'absentCount' => $absentCount,
                'attendedStudents' => $attendedStudents
            ];
        }

        return response()->json([
            'classId' => (string) $classId,
            'className' => $classroom->name ?? 'غير معروف',
            'dailyRecords' => $dailyRecords
        ]);
    }

    /**
     * Get attendance history for ALL classes for the current month.
     */
    public function getTeacherAttendanceHistory(Request $request)
    {
        $teacher = $request->user();
        $year = now()->year;
        $month = now()->format('m');

        if ($request->has('year') && $request->has('month')) {
            $year = $request->year;
            $month = str_pad($request->month, 2, '0', STR_PAD_LEFT);
        }

        $classes = $teacher->classrooms()->with('students.guardian')->get();
        $result = [];

        foreach ($classes as $classroom) {
            $students = $classroom->students;
            $totalStudents = $students->count();

            $attendances = Attendance::with('student.guardian')
                ->where('classroom_id', $classroom->id)
                ->whereYear('date', $year)
                ->whereMonth('date', $month)
                ->orderBy('date', 'desc')
                ->get();

            $dailyRecords = [];
            $groupedByDate = $attendances->groupBy(function($item) {
                return \Carbon\Carbon::parse($item->date)->format('Y-m-d');
            });

            foreach ($groupedByDate as $date => $records) {
                $presentCount = $records->whereIn('status', ['present', 'late'])->count();
                $absentCount = $records->whereIn('status', ['absent', 'excused'])->count();
                
                $attendedStudents = $records->map(function($record) {
                    $student = $record->student;
                    
                    $photoUrl = null;
                    if ($student) {
                        if ($student->image) {
                            $photoUrl = url('storage/' . ltrim($student->image, '/'));
                        } elseif ($student->guardian && $student->guardian->image) {
                            $photoUrl = url('storage/' . ltrim($student->guardian->image, '/'));
                        }
                    }

                    return [
                        'id' => (string) $record->student_id,
                        'name' => $student ? ($student->full_name ?? ($student->full_name_en ?? 'غير معروف')) : 'غير معروف',
                        'parentName' => $student && $student->guardian ? $student->guardian->name : 'غير محدد',
                        'parentPhone' => $student && $student->guardian ? $student->guardian->phone : 'غير محدد',
                        'photoUrl' => $photoUrl,
                        'status' => $record->status,
                    ];
                })->values()->all();

                $dailyRecords[] = [
                    'date' => $date,
                    'totalStudents' => $totalStudents,
                    'presentCount' => $presentCount,
                    'absentCount' => $absentCount,
                    'attendedStudents' => $attendedStudents
                ];
            }

            $result[] = [
                'classId' => (string) $classroom->id,
                'className' => $classroom->name ?? 'غير معروف',
                'dailyRecords' => $dailyRecords
            ];
        }

        return response()->json($result);
    }
}


