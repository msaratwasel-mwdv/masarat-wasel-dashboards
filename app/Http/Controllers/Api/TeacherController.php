<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\Attendance;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
                'nameEn' => $cls->name_en ?? $cls->name ?? 'Unknown',
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
                'nameEn' => $student->full_name_en ?? $student->full_name ?? 'Unknown',
                'parentName' => $guardian ? $guardian->name : 'غير محدد',
                'parentNameEn' => $guardian ? ($guardian->name_en ?? $guardian->name) : 'Not Specified',
                'parentPhone' => $guardian ? $guardian->phone : 'غير محدد',
                'photoUrl' => $photoUrl,
                'parentPhotoUrl' => $parentPhotoUrl,
                'status' => $attendance ? $attendance->status : 'unknown',
                'isLocked' => $attendance ? (bool) $attendance->is_notified : false,
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

        // Clean the student ID from common prefixes (like STUDENT-) used in QR codes and trim it
        if (is_string($studentId)) {
            $studentId = trim($studentId);
            $studentId = str_ireplace('STUDENT-', '', $studentId);
            $studentId = trim($studentId);
        }

        \Log::info("TeacherController.markAttendance called for studentId: {$studentId}", [
            'status' => $request->status,
            'via_qr' => $request->input('via_qr'),
            'via_qr_boolean' => $request->boolean('via_qr'),
            'all' => $request->all(),
        ]);

        $isEn = ($request->header('Accept-Language') === 'en' 
            || $request->input('lang') === 'en' 
            || ($request->user() && $request->user()->preferred_language === 'en'));

        $teacher = $request->user()->teacher;
        if (!$teacher || !$teacher->grade_id) {
            $msg = $isEn ? 'Unauthorized or teacher not assigned to a grade' : 'غير مصرح أو المعلم غير مسند لمرحلة دراسية';
            return response()->json(['message' => $msg], 403);
        }

        // Find student by ID, code, or national ID to support various QR/card formats
        $student = Student::with('enrollments')
            ->where(function($query) use ($studentId) {
                if (is_numeric($studentId)) {
                    $query->where('id', $studentId);
                }
                $query->orWhere('student_code', $studentId)
                      ->orWhere('national_id', $studentId);
            })
            ->firstOrFail();

        $enrollment = $student->currentEnrollment;
        if (!$enrollment) {
            $msg = $isEn ? 'Student not enrolled in any active class' : 'الطالب غير مسجل في أي فصل نشط حالياً';
            return response()->json(['message' => $msg], 400);
        }

        $classroom = $enrollment->classroom;
        if (!$classroom || $classroom->grade_id !== $teacher->grade_id) {
            $msg = $isEn ? 'Student does not belong to your assigned grade' : 'هذا الطالب غير مسجل في فصولك أو مرحلتك الدراسية';
            return response()->json(['message' => $msg], 403);
        }

        // Enforce lock rule: If attendance is already marked and notified (confirmed), it cannot be modified
        $existingAttendance = Attendance::where('student_id', $student->id)
            ->where('classroom_id', $enrollment->classroom_id)
            ->whereDate('date', today())
            ->first();

        if ($existingAttendance && $existingAttendance->is_notified && $existingAttendance->status !== 'unknown') {
            $msg = $isEn 
                ? 'Attendance is already confirmed and cannot be modified except by administration.' 
                : 'تم تأكيد تحضير هذا الطالب مسبقاً ولا يمكن تعديله إلا من خلال الإدارة';
            return response()->json(['message' => $msg], 403);
        }

        $viaQr = $request->boolean('via_qr', false);

        $attendance = Attendance::updateOrCreate(
            [
                'student_id' => $student->id,
                'classroom_id' => $enrollment->classroom_id,
                'date' => today(),
            ],
            [
                'status' => $request->status,
                'recorded_by' => $request->user()->id,
                'is_notified' => $viaQr, // Reset notification status, or mark as true immediately if via QR to prevent duplicate bulk notification
            ]
        );

        $student->load('guardians');
        if ($student->guardians->isNotEmpty()) {
            \Log::info("Broadcasting internal event for Student: {$student->id}");
            event(new \App\Events\TeacherAttendanceMarked($student, $request->status, today()->toDateString()));

            if ($viaQr) {
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
                            'student_id'   => (string) $student->id,
                            'student_name' => $student->full_name,
                            'student_name_en' => $student->full_name_en,
                            'status'       => $request->status,
                            'date'         => today()->toDateString(),
                            'category'     => 'attendance',
                            'target_screen' => 'attendance_details',
                        ],
                        translationParamsEn: [
                            'student' => $student->full_name_en ?: $student->full_name,
                            'status' => $statusEn,
                        ]
                    );
                }
            }
        }

        $msg = $isEn ? 'Attendance marked successfully' : 'تم تسجيل الحضور بنجاح';
        return response()->json(['message' => $msg, 'attendance' => $attendance]);
    }

    /**
     * Confirm and send notifications for classroom attendance.
     */
    public function confirmAttendance(Request $request, $classId)
    {
        $classroom = Classroom::findOrFail($classId);
        
        $notifiedCount = 0;

        DB::transaction(function () use ($classId, &$notifiedCount) {
            // 1. Lock and get records that haven't been notified yet and have a valid status
            $attendances = Attendance::with(['student.guardians'])
                ->where('classroom_id', $classId)
                ->whereDate('date', today())
                ->where('is_notified', false)
                ->where('status', '!=', 'unknown')
                ->lockForUpdate()
                ->get();

            if ($attendances->isEmpty()) {
                return;
            }

            // 2. Mark as notified immediately inside the transaction
            Attendance::whereIn('id', $attendances->pluck('id'))->update(['is_notified' => true]);

            // 3. Process notifications (can be done inside or outside, but here inside for atomicity)
            foreach ($attendances as $attendance) {
                $student = $attendance->student;
                if (!$student || $student->guardians->isEmpty()) continue;

            $statusAr = match ($attendance->status) {
                'present' => 'حاضراً',
                'absent'  => 'غائباً',
                'late'    => 'متأخراً',
                'excused' => 'معذوراً',
                default   => $attendance->status,
            };

            $statusEn = match ($attendance->status) {
                'present' => 'present',
                'absent'  => 'absent',
                'late'    => 'late',
                'excused' => 'excused',
                default   => $attendance->status,
            };

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
                        'student_id'   => (string) $student->id,
                        'student_name' => $student->full_name,
                        'student_name_en' => $student->full_name_en,
                        'status'       => $attendance->status,
                        'date'         => today()->toDateString(),
                        'category'     => 'attendance',
                        'target_screen' => 'attendance_details',
                    ],
                    translationParamsEn: [
                        'student' => $student->full_name_en ?: $student->full_name,
                        'status' => $statusEn,
                    ]
                );
            }

            $attendance->update(['is_notified' => true]);
            $notifiedCount++;
            }
        });

        return response()->json([
            'message' => "تم إرسال إشعارات الحضور لعدد $notifiedCount طلاب بنجاح.",
            'notified_count' => $notifiedCount
        ]);
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
