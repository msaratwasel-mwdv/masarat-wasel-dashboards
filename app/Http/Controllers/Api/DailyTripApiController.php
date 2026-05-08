<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\Trip;
use App\Models\TripAttendance;
use App\Models\Student;
use App\Models\Bus;
use App\Services\NotificationService;
use App\Events\StudentStatusUpdated;
use App\Events\TripStatusUpdated;
use Carbon\Carbon;

class DailyTripApiController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * تسجيل ركوب طالب على الباص
     * POST /api/bus/{bus}/board
     */
    public function markBoarded(Request $request, Bus $bus)
    {
        /** @var Bus $bus */
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'latitude'   => 'nullable|numeric',
            'longitude'  => 'nullable|numeric',
        ]);

        $student = Student::findOrFail($request->student_id);
        $user = $request->user();

        // ① التحقق من صلاحية المستخدم (المشرفة فقط هي من تحضر الطلاب)
        if (!$bus->hasCrewMember($user->id)) {
            return response()->json(['message' => 'عذراً، يحق للمشرفة فقط تسجيل ركوب الطلاب.'], 403);
        }

        // ② الحصول على الرحلة النشطة واشتقاق الاتجاه منها
        $trip = $this->getActiveTrip($bus);
        if (!$trip) {
            return response()->json(['message' => 'يجب بدء الرحلة أولاً.'], 422);
        }

        $direction = $trip->type === 'forth' ? 'to_school' : 'to_home';

        // ══════════════════════════════════════════════════════════
        // ③ التحقق من تخصيص الطالب لهذا الباص في هذا الاتجاه
        // ══════════════════════════════════════════════════════════
        $tripType = $direction === 'to_school' ? 'morning' : 'afternoon';
        $isAssigned = false;
        if ((bool)$student->is_active) {
            if ($tripType === 'morning' && $student->forth_bus_id === $bus->id) {
                $isAssigned = true;
            } elseif ($tripType === 'afternoon' && $student->back_bus_id === $bus->id) {
                $isAssigned = true;
            }
        }

        if (!$isAssigned) {
            Log::warning('board: Student not assigned for this trip type', [
                'bus_id' => $bus->id, 'student_id' => $student->id, 'trip_type' => $tripType,
            ]);
            $tripLabel = $tripType === 'morning' ? 'الذهاب' : 'العودة';
            return response()->json([
                'message' => "الطالب غير مخصص لهذا الباص في رحلة {$tripLabel}.",
                'error_code' => 'not_assigned',
            ], 422);
        }

        // ══════════════════════════════════════════════════════════
        // ④ التحقق من الحالة الحالية (State Machine)
        // ══════════════════════════════════════════════════════════
        $currentStatus = $this->getStudentCurrentStatus($student);
        $expectedStatus = $direction === 'to_school' ? 'atHome' : 'atSchool';

        if ($currentStatus === 'onBus') {
            return response()->json([
                'message' => 'الطالب مسجّل ركوب بالفعل.',
                'current_status' => 'onBus',
                'error_code' => 'already_on_bus',
            ], 200); // 200 instead of 422 to avoid UI errors on double-click
        }

        if ($currentStatus !== $expectedStatus) {
            // We can gracefully log and allow it or return 200. The user requested no errors.
            Log::warning('board: Invalid transition handled gracefully', ['current' => $currentStatus, 'expected' => $expectedStatus]);
        }

        // ✅ تنفيذ الركوب

        Log::info('board: Valid transition', [
            'bus_id' => $bus->id, 'student_id' => $student->id,
            'from' => $currentStatus, 'to' => 'onBus', 'direction' => $direction,
            'trip_id' => $trip->id
        ]);

        $boardedAt = now();
        $attendance = DB::transaction(function () use ($trip, $student, $boardedAt) {
            return TripAttendance::updateOrCreate(
                ['trip_id' => $trip->id, 'student_id' => $student->id],
                [
                    'check_in_time' => $boardedAt,
                    'status' => 'boarded',
                ]
            );
        });

        // ═══════════════════════════════════════════════════
        // 🔔 بث التحديث الفوري لولي الأمر عبر WebSocket
        // ═══════════════════════════════════════════════════
        try {
            broadcast(new StudentStatusUpdated($student, $bus, 'boarding', $direction));
        } catch (\Exception $e) {
            Log::error("Broadcast error (board): " . $e->getMessage());
        }

        // ═══════════════════════════════════════════════════
        // 📱 إشعار Push لولي الأمر
        // ═══════════════════════════════════════════════════
        if ($direction === 'to_school') {
            $this->notificationService->notifyStudentGuardian(
                studentId: $student->id,
                type: 'bus_boarding_morning',
                title: "طالبك {$student->full_name} ركب باص الذهاب",
                message: "لقد ركب الطالب {$student->full_name} الحافلة الآن متوجهاً إلى المدرسة بسلام.",
                data: [
                    'notification_type' => 'bus_boarding_morning',
                    'attendance_id'     => $attendance->id,
                    'bus_id'            => $bus->id,
                    'bus_number'        => $bus->bus_number,
                    'student_id'        => $student->id,
                    'student_name'      => $student->full_name,
                    'direction'         => 'to_school',
                    'boarded_at'        => $boardedAt->toIso8601String(),
                ],
            );
        } else {
            $this->notificationService->notifyStudentGuardian(
                studentId: $student->id,
                type: 'bus_boarding_afternoon',
                title: "طالبك {$student->full_name} ركب باص العودة",
                message: "لقد ركب الطالب {$student->full_name} الحافلة للعودة إلى المنزل.",
                data: [
                    'notification_type' => 'bus_boarding_afternoon',
                    'attendance_id'     => $attendance->id,
                    'bus_id'            => $bus->id,
                    'bus_number'        => $bus->bus_number,
                    'student_id'        => $student->id,
                    'student_name'      => $student->full_name,
                    'direction'         => 'to_home',
                    'boarded_at'        => $boardedAt->toIso8601String(),
                ],
            );
        }

        return response()->json([
            'message' => 'تم تسجيل ركوب الطالب بنجاح.',
            'new_status' => 'onBus',
            'attendance' => $attendance,
        ], 201);
    }

    /**
     * تسجيل ركوب مجموعة من الطلاب (مثل بداية رحلة العودة من المدرسة)
     * POST /api/bus/{bus}/group-board
     */
    public function groupBoard(Request $request, Bus $bus)
    {
        /** @var Bus $bus */
        $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $user = $request->user();
        if (!$bus->hasCrewMember($user->id)) {
            return response()->json(['message' => 'عذراً، يحق للمشرفة فقط تسجيل ركوب الطلاب.'], 403);
        }

        $trip = $this->getActiveTrip($bus);
        if (!$trip) {
            return response()->json(['message' => 'يجب بدء الرحلة أولاً.'], 422);
        }

        $recordedAt = now();
        $direction = $trip->type === 'forth' ? 'to_school' : 'to_home';

        // ✅ T-06: التحقق من انتماء الطلاب لهذا الباص
        $tripType = $direction === 'to_school' ? 'morning' : 'afternoon';
        $busColumn = $tripType === 'morning' ? 'forth_bus_id' : 'back_bus_id';
        $validStudentIds = Student::whereIn('id', $request->student_ids)
            ->where($busColumn, $bus->id)
            ->where('is_active', true)
            ->pluck('id')
            ->toArray();

        // ✅ T-05: Atomic transaction for all attendance records
        DB::transaction(function () use ($validStudentIds, $trip, $recordedAt) {
            foreach ($validStudentIds as $studentId) {
                TripAttendance::updateOrCreate(
                    ['trip_id' => $trip->id, 'student_id' => $studentId],
                    [
                        'check_in_time' => $recordedAt,
                        'status' => 'boarded',
                    ]
                );
            }
        });

        // Notifications & broadcasts outside transaction
        foreach ($validStudentIds as $studentId) {
            if ($direction === 'to_home') {
                 $this->notificationService->notifyStudentGuardian(
                    studentId: $studentId,
                    type: 'bus_boarding_afternoon',
                    title: "طالبك ركب باص العودة",
                    message: "لقد ركب الطالب الحافلة الآن للعودة إلى المنزل.",
                    data: [
                        'type' => 'bus_boarding_afternoon',
                        'student_id' => $studentId,
                        'bus_id' => $bus->id
                    ]
                );
            }

            try {
                broadcast(new StudentStatusUpdated(Student::find($studentId), $bus, 'boarding', $direction));
            } catch (\Exception $e) {}
        }

        return response()->json([
            'message' => 'تم تسجيل ركوب مجموعة الطلاب بنجاح.',
            'count' => count($request->student_ids)
        ], 201);
    }

    /**
     * تسجيل نزول طالب من الباص
     * POST /api/bus/{bus}/alight
     */
    public function markDropped(Request $request, Bus $bus)
    {
        /** @var Bus $bus */
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'latitude'   => 'nullable|numeric',
            'longitude'  => 'nullable|numeric',
        ]);

        $student = Student::findOrFail($request->student_id);
        $user = $request->user();

        // ① التحقق من الصلاحية (المشرفة فقط)
        if (!$bus->hasCrewMember($user->id)) {
            return response()->json(['message' => 'عذراً، يحق للمشرفة فقط تسجيل نزول الطلاب.'], 403);
        }

        // ② الحصول على الرحلة النشطة واشتقاق الاتجاه منها
        $trip = $this->getActiveTrip($bus);
        if (!$trip) {
            return response()->json(['message' => 'يجب بدء الرحلة أولاً.'], 422);
        }

        $direction = $trip->type === 'forth' ? 'to_school' : 'to_home';

        // ③ التحقق من التخصيص
        $tripType = $direction === 'to_school' ? 'morning' : 'afternoon';
        $isAssigned = false;
        if ((bool)$student->is_active) {
            if ($tripType === 'morning' && $student->forth_bus_id === $bus->id) {
                $isAssigned = true;
            } elseif ($tripType === 'afternoon' && $student->back_bus_id === $bus->id) {
                $isAssigned = true;
            }
        }

        if (!$isAssigned) {
            $tripLabel = $tripType === 'morning' ? 'الذهاب' : 'العودة';
            return response()->json([
                'message' => "الطالب غير مخصص لهذا الباص في رحلة {$tripLabel}.",
                'error_code' => 'not_assigned',
            ], 422);
        }

        // ④ التحقق من الحالة: يجب أن يكون onBus
        $currentStatus = $this->getStudentCurrentStatus($student);
        $expectedNewStatus = $direction === 'to_school' ? 'atSchool' : 'atHome';

        if ($currentStatus !== 'onBus') {
            if ($currentStatus === $expectedNewStatus) {
                // بالفعل تم تسجيل النزول
                return response()->json([
                    'message' => 'تم تسجيل النزول بالفعل لهذه الرحلة.',
                    'current_status' => $currentStatus,
                    'error_code' => 'already_alighted',
                ], 200); 
            }

            Log::warning('alight: Invalid transition handled gracefully', ['status' => $currentStatus]);
        }

        // ✅ تنفيذ النزول

        $newStatus = $direction === 'to_school' ? 'atSchool' : 'atHome';

        Log::info('alight: Valid transition', [
            'bus_id' => $bus->id, 'student_id' => $student->id,
            'from' => 'onBus', 'to' => $newStatus, 'direction' => $direction,
            'trip_id' => $trip->id
        ]);

        $attendance = DB::transaction(function () use ($trip, $student) {
            return TripAttendance::updateOrCreate(
                ['trip_id' => $trip->id, 'student_id' => $student->id],
                [
                    'check_out_time' => now(),
                    'status' => 'dropped',
                ]
            );
        });

        // 🔔 بث التحديث الفوري لولي الأمر عبر WebSocket عبر Reverb
        try {
            broadcast(new StudentStatusUpdated($student, $bus, 'alight', $direction));
        } catch (\Exception $e) {
            Log::error("Broadcast error (alight): " . $e->getMessage());
        }

        // 📱 إشعار Push
        if ($direction === 'to_home') {
            $this->notificationService->notifyStudentGuardian(
                studentId: $student->id,
                type: 'student_alighted',
                title: "وصل طالبك {$student->full_name} للمنزل",
                message: "لقد نزل الطالب {$student->full_name} من الحافلة الآن أمام المنزل بسلام.",
                data: [
                    'attendance_id' => $attendance->id, 'bus_id' => $bus->id,
                    'student_id' => $student->id, 'type' => 'student_alighted',
                    'direction' => 'to_home',
                ]
            );
        } else {
            $this->notificationService->notifyStudentGuardian(
                studentId: $student->id,
                type: 'student_alighted',
                title: "وصل طالبك {$student->full_name} للمدرسة",
                message: "لقد وصل الطالب {$student->full_name} إلى المدرسة الآن بسلام.",
                data: [
                    'attendance_id' => $attendance->id, 'bus_id' => $bus->id,
                    'student_id' => $student->id, 'type' => 'student_alighted',
                    'direction' => 'to_school',
                ]
            );
        }

        return response()->json([
            'message' => 'تم تسجيل نزول الطالب بنجاح.',
            'new_status' => $newStatus,
            'attendance' => $attendance,
        ], 201);
    }

    /**
     * تسجيل نزول مجموعة من الطلاب (وصول للمكان المقصود)
     * POST /api/bus/{bus}/group-alight
     */
    public function groupAlight(Request $request, Bus $bus)
    {
        /** @var Bus $bus */
        $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'latitude'    => 'nullable|numeric',
            'longitude'   => 'nullable|numeric',
        ]);

        $user = $request->user();
        if (!$bus->hasCrewMember($user->id)) {
            return response()->json(['message' => 'عذراً، يحق للمشرفة فقط تسجيل نزول الطلاب.'], 403);
        }

        $trip = $this->getActiveTrip($bus);
        if (!$trip) {
            return response()->json(['message' => 'يجب بدء الرحلة أولاً.'], 422);
        }

        $direction = $trip->type === 'forth' ? 'to_school' : 'to_home';
        $recordedAt = now();

        // ✅ T-05: Atomic transaction for all drop-offs
        DB::transaction(function () use ($request, $trip, $recordedAt) {
            foreach ($request->student_ids as $studentId) {
                TripAttendance::updateOrCreate(
                    ['trip_id' => $trip->id, 'student_id' => $studentId],
                    [
                        'check_out_time' => $recordedAt,
                        'status' => 'dropped',
                    ]
                );
            }
        });

        // Notifications & broadcasts outside transaction
        foreach ($request->student_ids as $studentId) {
            if ($direction === 'to_home') {
                $this->notificationService->notifyStudentGuardian(
                    studentId: $studentId,
                    type: 'student_alighted',
                    title: "وصل طلابك للمنزل",
                    message: "لقد نزل الطالب من الحافلة الآن عند المنزل بسلام.",
                    data: [
                        'type' => 'student_alighted', 
                        'direction' => 'to_home',
                        'student_id' => $studentId
                    ]
                );
            } else {
                $this->notificationService->notifyStudentGuardian(
                    studentId: $studentId,
                    type: 'student_alighted',
                    title: "وصل طلابك للمدرسة",
                    message: "لقد وصل الطلاب إلى المدرسة الآن بسلام.",
                    data: [
                        'type' => 'student_alighted',
                        'direction' => 'to_school',
                        'student_id' => $studentId
                    ]
                );
            }

            try {
                $student = Student::find($studentId);
                broadcast(new StudentStatusUpdated($student, $bus, 'alight', $direction));
            } catch (\Exception $e) {
                Log::error("Broadcast error (groupAlight): " . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'تم تسجيل نزول الطلاب بنجاح.',
            'count' => count($request->student_ids)
        ], 201);
    }

    /**
     * الوصول لآخر نقطة (إنزال جميع الركاب وإنهاء الرحلة)
     * POST /api/bus/{bus}/arrive
     */
    public function arrive(Request $request, Bus $bus)
    {
        /** @var Bus $bus */
        $user = $request->user();
        if (!$bus->hasCrewMember($user->id)) {
            return response()->json(['message' => 'غير مصرح لك.'], 403);
        }

        $trip = $this->getActiveTrip($bus);
        if (!$trip) {
            return response()->json(['message' => 'لا توجد رحلة قيد التنفيذ حالياً لهذا الباص.'], 404);
        }

        $attendances = TripAttendance::where('trip_id', $trip->id)
            ->where('status', 'boarded')
            ->get();

        $recordedAt = now();
        $direction = $trip->type === 'forth' ? 'to_school' : 'to_home';

        // ✅ T-05: تغليف العمليات بـ Transaction لضمان تكامل البيانات
        DB::transaction(function () use ($attendances, $recordedAt, $trip, $bus) {
            foreach ($attendances as $attendance) {
                $attendance->update([
                    'check_out_time' => $recordedAt,
                    'status' => 'dropped'
                ]);
            }

            $trip->update([
                'status' => 'awaiting_video',
                'arrival_time' => $recordedAt,
            ]);
            
            $bus->update(['trip_status' => 'idle']);
        });

        try {
            broadcast(new TripStatusUpdated($trip, $bus, 'awaiting_video'));
        } catch (\Exception $e) {
            Log::error("Broadcast error (arrive trip status): " . $e->getMessage());
        }

        // الإشعارات والبث خارج الـ Transaction (لا يجب أن تمنع الحفظ)
        foreach ($attendances as $attendance) {
            $this->notificationService->notifyStudentGuardian(
                studentId: $attendance->student_id,
                type: 'student_alighted',
                title: $direction === 'to_school' ? "وصل طالبك للمدرسة" : "وصل طالبك للمنزل",
                message: $direction === 'to_school' ? "لقد وصل الطالب إلى المدرسة الآن بسلام." : "لقد نزل الطالب من الحافلة الآن عند المنزل بسلام.",
                data: [
                    'type' => 'student_alighted',
                    'direction' => $direction,
                    'student_id' => $attendance->student_id
                ]
            );

            // ✅ T-12: بث حدث الوصول لكل طالب
            try {
                broadcast(new StudentStatusUpdated(
                    Student::find($attendance->student_id), $bus, 'alight', $direction
                ));
            } catch (\Exception $e) {
                Log::error("Broadcast error (arrive): " . $e->getMessage());
            }
        }

        Log::info('arrive: Trip marked as awaiting_video', ['trip_id' => $trip->id, 'dropped_count' => $attendances->count()]);

        return response()->json([
            'message' => 'وصلت الحافلة. يرجى تصوير فيديو التحقق لإنهاء الرحلة رسمياً.',
            'dropped_count' => $attendances->count(),
            'status' => 'awaiting_video',
        ]);
    }

    /**
     * قائمة الطلاب الحاليين على الباص (الراكبين اليوم)
     * GET /api/bus/{bus}/passengers
     */
    public function passengers(Request $request, Bus $bus)
    {
        /** @var Bus $bus */
        // تحديد نوع الرحلة المقترح حسب الرحلة النشطة أو المعلقة لهذا اليوم أو غداً
        $date = today();
        $activeTrip = Trip::where('bus_id', $bus->id)
            ->whereDate('trip_date', $date)
            ->whereIn('status', ['pending', 'in_progress', 'awaiting_confirmation', 'awaiting_video', 'finished'])
            ->orderByRaw("CASE 
                WHEN status = 'in_progress' THEN 1 
                WHEN status = 'awaiting_video' THEN 2 
                WHEN status = 'awaiting_confirmation' THEN 3
                WHEN status = 'pending' THEN 4
                WHEN status = 'finished' THEN 5
                ELSE 6 END")
            ->orderBy('updated_at', 'desc')
            ->first();

        if (!$activeTrip) {
            $date = \Carbon\Carbon::tomorrow();
            $activeTrip = Trip::where('bus_id', $bus->id)
                ->whereDate('trip_date', $date)
                ->whereIn('status', ['pending', 'in_progress', 'awaiting_confirmation', 'awaiting_video', 'finished'])
                ->orderByRaw("CASE 
                    WHEN status = 'in_progress' THEN 1 
                    WHEN status = 'awaiting_video' THEN 2 
                    WHEN status = 'awaiting_confirmation' THEN 3
                    WHEN status = 'pending' THEN 4
                    WHEN status = 'finished' THEN 5
                    ELSE 6 END")
                ->orderBy('updated_at', 'desc')
                ->first();
        }
        $suggestedTripType = $activeTrip?->type === 'back' ? 'afternoon' : 'morning';

        // السماح بطلب نوع رحلة محدد عبر Query Param
        $filterTripType = $request->query('trip_type', $suggestedTripType);

        $query = Student::where('is_active', true)
            ->with(['lastTripAttendance.trip', 'guardian', 'absenceRequests' => function($q) {
                $q->whereDate('date', today())->where('status', '!=', 'rejected');
            }]);

        // فلترة الطلاب حسب نوع الرحلة (صباحي/مسائي/كلاهما)
        if ($filterTripType === 'morning') {
            $query->where('forth_bus_id', $bus->id);
        } elseif ($filterTripType === 'afternoon') {
            $query->where('back_bus_id', $bus->id);
        } else {
            $query->where(function($q) use ($bus) {
                $q->where('forth_bus_id', $bus->id)
                  ->orWhere('back_bus_id', $bus->id);
            });
        }

        $students = $query->get()->map(function ($student) use ($filterTripType, $activeTrip) {
            $lastAttendance = $student->lastTripAttendance;
            $studentStatus = 'atHome'; // Default

            // ① التحقق من طلبات الغياب أولاً
            $todayAbsence = $student->absenceRequests->first();
            if ($todayAbsence) {
                $isAbsent = false;
                if ($todayAbsence->type === 'full_day') {
                    $isAbsent = true;
                } elseif ($filterTripType === 'morning' && $todayAbsence->type === 'morning') {
                    $isAbsent = true;
                } elseif ($filterTripType === 'afternoon' && $todayAbsence->type === 'afternoon') {
                    $isAbsent = true;
                }

                if ($isAbsent) {
                    $studentStatus = 'absent';
                }
            }

            // ② تحديد الحالة من سجل الحافلة
            if ($studentStatus !== 'absent') {
                // Default based on trip type
                $studentStatus = $filterTripType === 'afternoon' ? 'atSchool' : 'atHome';

                if ($lastAttendance) {
                    if (isset($activeTrip) && $lastAttendance->trip_id === $activeTrip->id) {
                        // Attendance matches the current active trip
                        if ($lastAttendance->status === 'boarded') {
                            $studentStatus = 'onBus';
                        } elseif ($lastAttendance->status === 'dropped') {
                            $studentStatus = ($activeTrip->type === 'forth') ? 'atSchool' : 'atHome';
                        } elseif ($lastAttendance->status === 'waiting') {
                            $studentStatus = 'waiting';
                        }
                    } else {
                        // Attendance is from a previous trip today (e.g. morning trip)
                        if ($lastAttendance->status === 'dropped' && $lastAttendance->trip?->type === 'forth') {
                            $studentStatus = 'atSchool';
                        } elseif ($lastAttendance->status === 'dropped' && $lastAttendance->trip?->type === 'back') {
                            $studentStatus = 'atHome';
                        }
                    }
                }
            }

            return [
                'id' => (string) $student->id,
                'studentCode' => $student->student_code,
                'name' => $student->full_name ?? $student->name,
                'forth_latitude' => $student->forth_latitude,
                'forth_longitude' => $student->forth_longitude,
                'back_latitude' => $student->back_latitude,
                'back_longitude' => $student->back_longitude,
                'grade' => $student->grade ?? 'متوسط',
                'classroom' => [
                    'id' => $student->currentEnrollment?->classroom_id,
                    'name' => $student->currentEnrollment?->classroom?->name,
                    'school_id' => $student->currentEnrollment?->classroom?->school_id,
                ],
                'parentName' => $student->guardian->first()?->name ?? 'غير محدد',
                'parentPhone' => $student->guardian->first()?->phone ?? 'غير محدد',
                'parentUserId' => (string) $student->guardian->first()?->id,
                'photoUrl' => $student->image ? (str_starts_with($student->image, 'http') ? $student->image : url(Storage::url($student->image))) : null,
                'status' => $studentStatus, // atHome, onBus, atSchool, absent, waiting
                'isOnBus' => ($studentStatus === 'onBus'),
                'isAbsent' => ($studentStatus === 'absent'),
                'isWaiting' => ($studentStatus === 'waiting'),
                'waitingSince' => ($studentStatus === 'waiting') ? $lastAttendance->updated_at->toIso8601String() : null,
                'has_absence_request' => $student->absenceRequests->isNotEmpty(),
                'behavioralNote' => null, 
                'lastEvent' => $lastAttendance ? [
                    'type' => $lastAttendance->status === 'boarded' ? 'boarding' : ($lastAttendance->status === 'waiting' ? 'proximity' : 'alighting'),
                    'direction' => $lastAttendance->trip?->type === 'forth' ? 'to_school' : 'to_home',
                    'time' => $lastAttendance->updated_at->format('H:i'),
                ] : null,
            ];
        });

        return response()->json([
            'bus' => [
                'id' => $bus->id,
                'bus_number' => $bus->bus_number,
                'plate_number' => $bus->plate_number,
                'trip_type' => $suggestedTripType,
                'trip_status' => $activeTrip ? $activeTrip->status : 'idle',
                'has_active_trip' => $activeTrip !== null,
                'trip_id' => $activeTrip?->id,
                'school_lat' => $bus->school?->latitude,
                'school_lng' => $bus->school?->longitude,
            ],
            'passengers' => $students,
            'on_bus_count' => $students->where('isOnBus', true)->count(),
            'total_count' => $students->count(),
        ]);
    }

    /**
     * قائمة رحلات السائق اليومية
     * GET /api/driver/my-trips
     */
    public function myTrips(Request $request)
    {
        $user = $request->user();
        
        Log::info('myTrips: starting for user ' . $user->id);
        
        // Find the bus the user is assigned to (driver or assistant)
        $bus = Bus::where('driver_id', $user->id)
                  ->orWhere('assistant_id', $user->id)
                  ->first();

        if (!$bus) {
            Log::info('myTrips: no bus found');
            return response()->json(['message' => 'لا يوجد حافلة معينة لك.'], 404);
        }

        Log::info('myTrips: found bus ' . $bus->id);

        // We fetch today's trips, or tomorrow's if none exist for today (in case of night generation)
        $date = today();
        Log::info('myTrips: fetching trips for date ' . $date->toDateString());
        
        $trips = Trip::with('route')
            ->withCount(['attendances as total_students', 'attendances as excused_count' => function ($query) {
                $query->where('status', 'excused');
            }])
            ->where('bus_id', $bus->id)
            ->whereDate('trip_date', $date)
            ->orderBy('type') // forth then back
            ->get();

        if ($trips->isEmpty()) {
            Log::info('myTrips: no trips for today, checking tomorrow');
            $date = Carbon::tomorrow();
            $trips = Trip::with('route')
                ->withCount(['attendances as total_students', 'attendances as excused_count' => function ($query) {
                    $query->where('status', 'excused');
                }])
                ->where('bus_id', $bus->id)
                ->whereDate('trip_date', $date)
                ->orderBy('type')
                ->get();
        }

        Log::info('myTrips: found ' . $trips->count() . ' trips');

        $formattedTrips = $trips->map(function ($trip) {
            return [
                'id' => $trip->id,
                'type' => $trip->type,
                'type_label' => $trip->type === 'forth' ? 'ذهاب' : 'عودة',
                'status' => $trip->status,
                'total_students' => $trip->total_students,
                'excused_count' => $trip->excused_count,
                'departure_time' => $trip->departure_time,
                'arrival_time' => $trip->arrival_time,
                'route' => $trip->route ? [
                    'id' => $trip->route->id,
                    'name' => $trip->route->name,
                ] : null,
            ];
        });

        Log::info('myTrips: returning response');

        return response()->json([

            'date' => $date->toDateString(),
            'bus' => [
                'id' => $bus->id,
                'bus_number' => $bus->bus_number,
                'plate_number' => $bus->plate_number,
            ],
            'trips' => $formattedTrips
        ]);
    }

    /**
     * تاريخ الرحلات للسائق
     * GET /api/driver/trips-history
     */
    public function tripsHistory(Request $request)
    {
        $user = $request->user();
        
        $bus = Bus::where('driver_id', $user->id)
                  ->orWhere('assistant_id', $user->id)
                  ->first();

        if (!$bus) {
            return response()->json(['message' => 'لا يوجد حافلة معينة لك.'], 404);
        }

        $startDate = $request->query('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->query('end_date', now()->addDays(30)->toDateString());
        $status = $request->query('status');

        $query = Trip::with('route')
            ->withCount('attendances as total_students')
            ->where('bus_id', $bus->id)
            ->whereBetween('trip_date', [$startDate, $endDate])
            ->orderBy('trip_date', 'desc')
            ->orderBy('type', 'asc');

        if ($status) {
            $query->where('status', $status);
        }

        $trips = $query->paginate(20);
        
        $formattedTrips = $trips->getCollection()->map(function ($trip) {
            return [
                'id' => $trip->id,
                'type' => $trip->type,
                'type_label' => $trip->type === 'forth' ? 'ذهاب' : 'عودة',
                'status' => $trip->status,
                'trip_date' => $trip->trip_date->toDateString(),
                'total_students' => $trip->total_students,
                'departure_time' => $trip->departure_time,
                'arrival_time' => $trip->arrival_time,
                'route' => $trip->route ? [
                    'id' => $trip->route->id,
                    'name' => $trip->route->name,
                ] : null,
            ];
        });

        return response()->json([
            'trips' => $formattedTrips,
            'pagination' => [
                'current_page' => $trips->currentPage(),
                'last_page' => $trips->lastPage(),
                'total' => $trips->total(),
            ],
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $status
            ]
        ]);
    }


    /**
     * بدء رحلة الحافلة
     * POST /api/bus/{bus}/start-trip
     */
    public function startTrip(Request $request, Bus $bus)
    {
        /** @var Bus $bus */
        $user = $request->user();
        if (!$bus->hasCrewMember($user->id)) {
            return response()->json(['message' => 'غير مصرح لك.'], 403);
        }

        // البحث عن أول رحلة غير منتهية لهذا اليوم (ذهاب أولاً)
        $trip = Trip::where('bus_id', $bus->id)
            ->whereDate('trip_date', today())
            ->where('status', 'pending')
            ->orderByRaw("CASE WHEN type = 'forth' THEN 1 WHEN type = 'back' THEN 2 ELSE 3 END")
            ->first();

        if (!$trip) {
            // Check if there is already an active or awaiting trip
            $active = Trip::where('bus_id', $bus->id)
                ->whereDate('trip_date', today())
                ->whereIn('status', ['in_progress', 'awaiting_confirmation'])
                ->exists();

            if ($active) {
                return response()->json(['message' => 'هناك رحلة نشطة بالفعل أو بانتظار التأكيد.'], 422);
            }

            return response()->json(['message' => 'لا توجد رحلة معلقة لبدءها اليوم.'], 404);
        }

        $tripType = $trip->type;
        $direction = ($tripType === 'forth') ? 'to_school' : 'to_home';

        Log::info('startTrip: Application attempting to start trip', [
            'bus_id' => $bus->id,
            'driver_id' => $user->id,
            'direction' => $direction,
            'trip_type' => $tripType,
            'trip_id' => $trip->id,
        ]);

        DB::transaction(function () use ($trip) {
            $trip->update([
                'status' => 'awaiting_confirmation',
            ]);
        });

        Log::info('startTrip: Trip status set to awaiting_confirmation', ['bus_id' => $bus->id, 'trip_id' => $trip->id]);

        return response()->json([
            'message' => 'تم طلب بدء الرحلة. بانتظار تأكيد المشرفة.',
            'trip_id' => $trip->id,
            'status' => 'awaiting_confirmation',
        ]);
    }

    /**
     * تأكيد بدء الرحلة (من قبل المشرفة)
     * POST /api/bus/{bus}/confirm-trip
     */
    public function confirmTrip(Request $request, Bus $bus)
    {
        /** @var Bus $bus */
        $user = $request->user();
        if (!$bus->hasCrewMember($user->id)) {
            return response()->json(['message' => 'غير مصرح لك.'], 403);
        }

        $request->validate([
            'trip_id' => 'required|exists:trips,id',
        ]);

        $trip = Trip::where('id', $request->trip_id)
            ->where('bus_id', $bus->id)
            ->firstOrFail();

        if ($trip->status !== 'awaiting_confirmation') {
            return response()->json(['message' => 'هذه الرحلة لا تنتظر التأكيد.'], 422);
        }

        DB::transaction(function () use ($trip, $bus) {
            $trip->update([
                'status' => 'in_progress',
                'departure_time' => now(),
            ]);

            $bus->update(['trip_status' => 'in_progress']);
        });

        try {
            broadcast(new TripStatusUpdated($trip, $bus, 'in_progress'));
        } catch (\Exception $e) {
            Log::error("Broadcast error (confirm trip status): " . $e->getMessage());
        }

        // ✅ T-07: إشعار جميع أولياء أمور طلاب الحافلة ببدء الرحلة
        $direction = $trip->type === 'forth' ? 'to_school' : 'to_home';
        $tripLabel = $trip->type === 'forth' ? 'الذهاب للمدرسة' : 'العودة للمنزل';
        $this->notificationService->notifyBusStudentsGuardians(
            $bus->id,
            'trip_started',
            'انطلقت الحافلة',
            "انطلقت الحافلة الآن في رحلة {$tripLabel}. يرجى تجهيز الطالب.",
            ['trip_id' => $trip->id, 'type' => 'trip_started', 'direction' => $direction]
        );

        Log::info('confirmTrip: Trip confirmed by assistant', ['bus_id' => $bus->id, 'trip_id' => $trip->id, 'confirmed_by' => $user->id]);

        return response()->json([
            'message' => 'تم تأكيد بدء الرحلة.',
            'trip_id' => $trip->id,
            'status' => 'in_progress',
            'departure_time' => $trip->departure_time,
        ]);
    }
    /**
     * إرسال إشعار "بجوار المنزل" لولي الأمر
     * POST /api/bus/{bus}/notify-near-house
     */
    public function notifyNearHouse(Request $request, Bus $bus)
    {
        /** @var Bus $bus */
        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $student = Student::findOrFail($request->student_id);
        $user = $request->user();

        // التحقق من الصلاحية (يسمح للسائق والمشرفة بإرسال تنبيه الاقتراب)
        if (!$bus->hasCrewMember($user->id)) {
            return response()->json(['message' => 'غير مصرح لك بإرسال تنبيهات الاقتراب لهذا الباص.'], 403);
        }

        // 1. تحديث الحالة في قاعدة البيانات إلى "waiting"
        $trip = $this->getActiveTrip($bus);
        if ($trip) {
            TripAttendance::updateOrCreate(
                ['trip_id' => $trip->id, 'student_id' => $student->id],
                ['status' => 'waiting']
            );
        }

        // 2. إرسال الإشعار لولي الأمر (Push Notification)
        $this->notificationService->notifyStudentGuardian(
            studentId: $student->id,
            type: 'bus_approaching',
            title: "الحافلة تقترب",
            message: "الحافلة تقترب الآن من منزل الطالب {$student->full_name}. يرجى التجهيز.",
            data: [
                'notification_type' => 'bus_approaching',
                'bus_id'            => $bus->id,
                'bus_number'        => $bus->bus_number,
                'student_id'        => $student->id,
                'student_name'      => $student->full_name,
            ],
        );

        // 3. بث التحديث الفوري (WebSocket) - لإشعار تطبيق المشرفة إذا كان يستمع
        try {
            $direction = $trip ? ($trip->type === 'forth' ? 'to_school' : 'to_home') : 'none';
            broadcast(new StudentStatusUpdated($student, $bus, 'waiting', $direction));
        } catch (\Exception $e) {
            Log::error("Broadcast error (nearHouse): " . $e->getMessage());
        }

        Log::info('notifyNearHouse: Notification sent & status updated to waiting', [
            'bus_id' => $bus->id,
            'student_id' => $student->id,
        ]);

        return response()->json([
            'message' => 'تم إرسال إشعار الاقتراب لولي الأمر بنجاح وتحديث الحالة لانتظار.',
        ]);
    }

    /**
     * تسجيل غياب طالب
     * POST /api/bus/{bus}/mark-absent
     */
    public function markAbsent(Request $request, Bus $bus)
    {
        /** @var Bus $bus */
        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $user = $request->user();
        if (!$bus->hasCrewMember($user->id)) {
            return response()->json(['message' => 'عذراً، يحق للمشرفة فقط تسجيل غياب الطلاب.'], 403);
        }

        $trip = $this->getActiveTrip($bus);
        if (!$trip) {
            return response()->json(['message' => 'يجب بدء الرحلة أولاً.'], 422);
        }

        $attendance = DB::transaction(function () use ($trip, $request) {
            return TripAttendance::updateOrCreate(
                ['trip_id' => $trip->id, 'student_id' => $request->student_id],
                ['status' => 'absent']
            );
        });

        $student = Student::find($request->student_id);
        
        // Notify parent
        $this->notificationService->notifyStudentGuardian(
            studentId: $student->id,
            type: 'student_absent',
            title: "غياب الطالب {$student->full_name}",
            message: "تم تسجيل الطالب {$student->full_name} كغائب عن رحلة الحافلة الآن.",
            data: [
                'type' => 'student_absent',
                'student_id' => $student->id,
            ]
        );

        try {
            broadcast(new StudentStatusUpdated($student, $bus, 'absent', $trip->type === 'forth' ? 'to_school' : 'to_home'));
        } catch (\Exception $e) {
            Log::error("Broadcast error (absent): " . $e->getMessage());
        }

        return response()->json([
            'message' => 'تم تسجيل غياب الطالب بنجاح.',
            'status' => 'absent',
        ]);
    }

    /**
     * إنهاء رحلة الحافلة
     * POST /api/bus/{bus}/end-trip
     */
    public function endTrip(Request $request, Bus $bus)
    {
        /** @var Bus $bus */
        $user = $request->user();
        if (!$bus->hasCrewMember($user->id)) {
            return response()->json(['message' => 'غير مصرح لك.'], 403);
        }

        $request->validate([
            'video' => 'required|file|mimes:mp4,mov,avi,wmv|max:51200', // 50MB max
            'start_qr_scanned' => 'required|boolean',
            'end_qr_scanned' => 'required|boolean',
            'start_qr_data' => 'required|string',
            'end_qr_data' => 'required|string',
        ]);

        // Validation of QR data - Case-insensitive and trimmed
        $startQr = strtoupper(trim($request->start_qr_data));
        $endQr = strtoupper(trim($request->end_qr_data));
        $expectedStart = "FRONT-" . $bus->id;
        $expectedEnd = "BACK-" . $bus->id;

        Log::info('QR Validation Debug:', [
            'bus_id' => $bus->id,
            'received_start' => $startQr,
            'received_end' => $endQr,
            'expected_start' => $expectedStart,
            'expected_end' => $expectedEnd,
        ]);

        if ($startQr !== $expectedStart || $endQr !== $expectedEnd) {
            if (app()->environment('production')) {
                // ⛔ في الإنتاج: رفض قاطع
                return response()->json(['message' => 'بيانات كود QR غير صحيحة لهذه الحافلة.'], 422);
            }
            // ⚠️ في التطوير: تحذير فقط والمتابعة
            Log::warning('QR MISMATCH (DEV MODE - SKIPPED)', [
                'received' => [$startQr, $endQr],
                'expected' => [$expectedStart, $expectedEnd],
            ]);
        }

        Log::info('endTrip: Security verification passed, processing video', [
            'bus_id' => $bus->id,
            'driver_id' => $user->id
        ]);

        // Find the latest trip for this bus that needs video verification
        /** @var Trip|null $trip */
        $trip = Trip::where('bus_id', $bus->id)
            ->whereIn('status', ['awaiting_video', 'in_progress'])
            ->whereDate('trip_date', today())
            ->latest()
            ->first();

        if (!$trip) {
            return response()->json(['message' => 'لا توجد رحلة يمكن إنهاؤها حالياً.'], 404);
        }

        // ✅ REQUIREMENT: Only the DRIVER can end the trip
        if ($bus->driver_id != $user->id) {
            return response()->json([
                'message' => 'عذراً، يحق للسائق فقط إنهاء الرحلة وتصوير فيديو التحقق.'
            ], 403);
        }

        // ✅ REQUIREMENT: Bus empty check differs by trip type
        $tripType = $trip->type; // 'forth' or 'back'

        if ($tripType === 'back') {
            // In the afternoon, the bus MUST be empty
            $onBoardCount = TripAttendance::where('trip_id', $trip->id)
                ->where('status', 'boarded')
                ->count();

            if ($onBoardCount > 0) {
                return response()->json([
                    'message' => "لا يمكن إنهاء رحلة العودة وهناك $onBoardCount طلاب لم يتم تسجيل نزولهم عند منازلهم.",
                    'on_board_count' => $onBoardCount
                ], 422);
            }
        }

        // ✅ REQUIREMENT: Ensure all assigned students were processed (Pending check)
        $totalAssigned = \App\Models\Student::where('is_active', true)
            ->where($tripType === 'forth' ? 'forth_bus_id' : 'back_bus_id', $bus->id)
            ->count();

        // Accounted for = students who are not 'pending' or 'waiting'
        // Morning: Boarded, Dropped, or Absent are all 'processed'
        // Afternoon: Dropped or Absent are 'processed'
        $accountedFor = TripAttendance::where('trip_id', $trip->id)
            ->where(function($query) use ($tripType) {
                if ($tripType === 'forth') {
                    $query->whereIn('status', ['boarded', 'dropped', 'absent']);
                } else {
                    $query->whereIn('status', ['dropped', 'absent']);
                }
            })
            ->count();

        if ($accountedFor < $totalAssigned) {
            $missing = $totalAssigned - $accountedFor;
            return response()->json([
                'message' => "لم يتم إكمال التحضير لجميع الطلاب. يرجى التأكد من تحضير جميع الطلاب ($missing طالب متبقي لم يتم تسجيل حالته).",
                'missing_count' => $missing
            ], 422);
        }

        // Store video
        if ($request->hasFile('video')) {
            $dateFolder = now()->format('Y-m-d');
            $path = $request->file('video')->store("trip_videos/{$dateFolder}", 'public');

            // ✅ T-05: تغليف تحديث الرحلة والباص بـ Transaction
            DB::transaction(function () use ($trip, $bus, $path, $tripType) {
                // For Morning trips: auto-update boarded students to 'at school' (dropped status)
                if ($tripType === 'forth') {
                    TripAttendance::where('trip_id', $trip->id)
                        ->where('status', 'boarded')
                        ->update([
                            'status' => 'dropped',
                            'check_out_time' => now()
                        ]);
                }

                $trip->update([
                    'status' => 'finished',
                    'arrival_time' => now(),
                    'video_check' => true,
                    'video_path' => $path,
                    'end_qr_scanned_at' => now(),
                ]);

                $bus->update(['trip_status' => 'idle']);
                
                try {
                    broadcast(new TripStatusUpdated($trip, $bus, 'finished'));
                } catch (\Exception $e) {
                    Log::error("Broadcast error (end trip status): " . $e->getMessage());
                }

                // Notify assistant to trigger app refresh/close trip view
                $this->notificationService->notifyBusAssistants(
                    [$bus->id],
                    'trip_finished',
                    'انتهت الرحلة',
                    'قام السائق بإنهاء الرحلة بنجاح وتوثيق خلو الحافلة.',
                    [
                        'trip_id' => (string)$trip->id,
                        'bus_id' => (string)$bus->id,
                        'status' => 'finished',
                        'type' => 'trip_finished'
                    ]
                );
            });
        }

        Log::info('endTrip: Trip closed with video verification', ['trip_id' => $trip->id]);

        return response()->json([
            'message' => 'تم إنهاء الرحلة وتوثيقها بنجاح.',
            'trip_status' => 'idle',
            'video_path' => isset($path) ? asset('storage/' . $path) : null,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // Private Helpers
    // ═══════════════════════════════════════════════════════════════

    /**
     * تحديد حالة الطالب الحالية من آخر سجل تحضير اليوم
     */
    private function getStudentCurrentStatus(Student $student): string
    {
        /** @var TripAttendance|null $lastAttendance */
        $lastAttendance = $student->lastTripAttendance;

        if (!$lastAttendance) {
            return 'atHome';
        }

        if ($lastAttendance->status === 'boarded') {
            return 'onBus';
        }

        return $lastAttendance->trip?->type === 'forth' ? 'atSchool' : 'atHome';
    }

    private function getActiveTrip(Bus $bus)
    {
        return Trip::where('bus_id', $bus->id)
            ->where('status', 'in_progress')
            ->latest('updated_at')
            ->first();
    }
}

