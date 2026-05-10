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
        $teacher = $request->user()->teacher;
        if (!$teacher || !$teacher->grade_id) {
            return response()->json([]);
        }
        
        $classes = Classroom::where('grade_id', $teacher->grade_id)->withCount('students')->get();
        
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
            } 
            
            $parentPhotoUrl = null;
            $guardian = $student->guardian instanceof \Illuminate\Database\Eloquent\Collection ? $student->guardian->first() : $student->guardian;
            if ($guardian && $guardian->image) {
                $parentPhotoUrl = url('storage/' . ltrim($guardian->image, '/'));
            }

            return [
                'id' => (string) $student->id,
                'name' => $student->full_name ?? ($student->full_name_en ?? 'غير معروف'),
                'parentName' => $guardian ? $guardian->name : 'غير محدد',
                'parentPhone' => $guardian ? $guardian->phone : 'غير محدد',
                'photoUrl' => $photoUrl,
                'parentPhotoUrl' => $parentPhotoUrl,
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

            $statusEn = match ($request->status) {
                'present' => 'present',
                'absent'  => 'absent',
                'late'    => 'late',
                'excused' => 'excused',
                default   => $request->status,
            };

            $this->notificationService->notifyStudentGuardian(
                studentId: $student->id,
                type: 'school_attendance',
                title: 'تحديث سجل الحضور المدرسي',
                message: "تم تسجيل {$student->full_name} {$statusAr} اليوم.",
                titleEn: 'School Attendance Update',
                messageEn: "{$student->full_name_en} has been marked as {$statusEn} today.",
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
                $parentPhotoUrl = null;
                if ($student) {
                    if ($student->image) {
                        $photoUrl = url('storage/' . ltrim($student->image, '/'));
                    } 
                    $guardian = $student->guardian instanceof \Illuminate\Database\Eloquent\Collection ? $student->guardian->first() : $student->guardian;
                    if ($guardian && $guardian->image) {
                        $parentPhotoUrl = url('storage/' . ltrim($guardian->image, '/'));
                    }
                }

                return [
                    'id' => (string) $record->student_id,
                    'name' => $student ? ($student->full_name ?? ($student->full_name_en ?? 'غير معروف')) : 'غير معروف',
                    'parentName' => $guardian ? $guardian->name : 'غير محدد',
                    'parentPhone' => $guardian ? $guardian->phone : 'غير محدد',
                    'photoUrl' => $photoUrl,
                    'parentPhotoUrl' => $parentPhotoUrl,
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
        $teacher = $request->user()->teacher;
        if (!$teacher || !$teacher->grade_id) {
            return response()->json([]);
        }

        $year  = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        $classes = Classroom::where('grade_id', $teacher->grade_id)->with('students.guardian')->get();
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
                    $parentPhotoUrl = null;
                    if ($student) {
                        if ($student->image) {
                            $photoUrl = url('storage/' . ltrim($student->image, '/'));
                        } 
                        $guardian = $student->guardian instanceof \Illuminate\Database\Eloquent\Collection ? $student->guardian->first() : $student->guardian;
                        if ($guardian && $guardian->image) {
                            $parentPhotoUrl = url('storage/' . ltrim($guardian->image, '/'));
                        }
                    }

                    return [
                        'id' => (string) $record->student_id,
                        'name' => $student ? ($student->full_name ?? ($student->full_name_en ?? 'غير معروف')) : 'غير معروف',
                        'parentName' => $guardian ? $guardian->name : 'غير محدد',
                        'parentPhone' => $guardian ? $guardian->phone : 'غير محدد',
                        'photoUrl' => $photoUrl,
                        'parentPhotoUrl' => $parentPhotoUrl,
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

    /**
     * Get attendance reporting stats for the teacher.
     */
    public function getAttendanceStats(Request $request)
    {
        $teacher = $request->user()->teacher;
        if (!$teacher || !$teacher->grade_id) {
            return response()->json([
                'totalStudents' => 0,
                'presentToday' => 0,
                'absentToday' => 0,
                'unmarkedToday' => 0,
                'averageAttendance' => 0,
                'weeklyTrend' => [],
                'studentReports' => [],
            ]);
        }
        $classes = Classroom::where('grade_id', $teacher->grade_id)->with('students')->get();
        
        $totalStudents = 0;
        $presentToday = 0;
        $absentToday = 0;
        $unmarkedToday = 0;
        
        $studentReports = [];

        foreach ($classes as $classroom) {
            $classroomStudents = $classroom->students;
            $totalStudents += $classroomStudents->count();

            foreach ($classroomStudents as $student) {
                // Today's attendance
                $attendance = Attendance::where('student_id', $student->id)
                    ->whereDate('date', today())
                    ->first();

                if ($attendance) {
                    if (in_array($attendance->status, ['present', 'late'])) {
                        $presentToday++;
                    } else {
                        $absentToday++;
                    }
                } else {
                    $unmarkedToday++;
                }

                // Overall counts for this student
                $pCount = Attendance::where('student_id', $student->id)
                    ->whereIn('status', ['present', 'late'])
                    ->count();
                $aCount = Attendance::where('student_id', $student->id)
                    ->whereIn('status', ['absent', 'excused'])
                    ->count();

                $photoUrl = null;
                if ($student->image) {
                    $photoUrl = url('storage/' . ltrim($student->image, '/'));
                }

                $studentReports[] = [
                    'name' => $student->full_name ?? ($student->full_name_en ?? 'غير معروف'),
                    'civilId' => $student->national_id ?? $student->student_code,
                    'presentCount' => $pCount,
                    'absentCount' => $aCount,
                    'photoUrl' => $photoUrl,
                ];
            }
        }

        $avg = $totalStudents > 0 ? ($presentToday / $totalStudents) * 100 : 0;

        return response()->json([
            'totalStudents' => $totalStudents,
            'presentToday' => $presentToday,
            'absentToday' => $absentToday,
            'unmarkedToday' => $unmarkedToday,
            'averageAttendance' => $avg,
            'weeklyTrend' => [], // Can be implemented if needed
            'studentReports' => $studentReports,
        ]);
    }
}
