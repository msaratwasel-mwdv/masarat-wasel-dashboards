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
    protected \App\Services\TripService $tripService;

    public function __construct(NotificationService $notificationService, \App\Services\TripService $tripService)
    {
        $this->notificationService = $notificationService;
        $this->tripService = $tripService;
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
        $currentStatus = $this->getStudentCurrentStatus($student, $trip);
        $expectedStatus = $direction === 'to_school' ? 'atHome' : 'atSchool';

        // Check the exact database status to avoid 'waiting' being misconstrued as 'boarded'
        $activeAttendance = TripAttendance::where('trip_id', $trip->id)->where('student_id', $student->id)->first();
        $exactStatus = $activeAttendance?->status;

        if ($exactStatus === 'boarded') {
            return response()->json([
                'message' => 'الطالب مسجّل ركوب بالفعل.',
                'current_status' => 'onBus',
                'error_code' => 'already_on_bus',
            ], 200); // 200 instead of 422 to avoid UI errors on double-click
        }

        if ($currentStatus !== $expectedStatus && $exactStatus !== 'waiting') {
            // We can gracefully log and allow it or return 200. The user requested no errors.
            Log::warning('board: Invalid transition handled gracefully', ['current' => $currentStatus, 'expected' => $expectedStatus]);
        }

        // ✅ تنفيذ الركوب
        $boardedAt = now();
        $isAlreadyBoarded = TripAttendance::where('trip_id', $trip->id)
            ->where('student_id', $student->id)
            ->where('status', 'boarded')
            ->exists();

        if ($isAlreadyBoarded) {
             return response()->json([
                'message' => 'الطالب مسجّل ركوب بالفعل.',
                'current_status' => 'onBus',
            ], 200);
        }

        $attendance = DB::transaction(function () use ($trip, $student, $boardedAt) {
            $existing = TripAttendance::where('trip_id', $trip->id)->where('student_id', $student->id)->first();
            $extraWaitTime = 0;
            if ($existing && $existing->status === 'waiting' && $existing->waiting_start_time) {
                $waitingSeconds = (int) abs($boardedAt->diffInSeconds($existing->waiting_start_time, false));
                if ($waitingSeconds > 120) {
                    $extraWaitTime = $waitingSeconds - 120;
                }
            }

            return TripAttendance::updateOrCreate(
                ['trip_id' => $trip->id, 'student_id' => $student->id],
                [
                    'check_in_time' => $boardedAt,
                    'status' => 'boarded',
                    'extra_wait_time' => $extraWaitTime,
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
        $student->loadMissing('guardians');
        $notificationType = $direction === 'to_school' ? 'bus_boarding_morning' : 'bus_boarding_afternoon';
        
        foreach ($student->guardians as $guardian) {
            $studentNameEn = !empty($student->full_name_en) ? $student->full_name_en : $student->full_name;

            $notification = $this->notificationService->sendTranslatedToUser(
                userId: $guardian->id,
                type: $notificationType,
                titleKey: 'notifications.student_status_title',
                messageKey: 'notifications.student_picked_up',
                translationParams: ['student' => $student->full_name],
                data: [
                    'notification_type' => $notificationType,
                    'attendance_id'     => $attendance->id,
                    'bus_id'            => $bus->id,
                    'bus_number'        => $bus->bus_number,
                    'student_id'        => $student->id,
                    'student_name'      => $student->full_name,
                    'student_name_en'   => $student->full_name_en,
                    'direction'         => $direction,
                    'boarded_at'        => $boardedAt->toIso8601String(),
                    'category' => 'bus_tracking',
                    'target_screen'     => 'children_status',
                ],
                fromUserName: 'نظام النقل',
                translationParamsEn: ['student' => $studentNameEn]
            );

            // 📢 Sync Real-time UI
            event(new \App\Events\NotificationPushed($notification, $guardian->id));
        }

        return response()->json([
            'message' => 'تم تسجيل ركوب الطالب بنجاح.',
            'new_status' => 'onBus',
            'attendance' => $attendance,
        ], 201);
    }

    /**
     * المسح الذكي للـ QR (Smart Trigger)
     * POST /api/bus/{bus}/scan-qr
     */
    public function scanQr(Request $request, Bus $bus)
    {
        $request->validate([
            'code' => 'required|string', // يمكن أن يكون STUDENT-123 أو 123 مباشرة
        ]);

        $user = $request->user();
        if (!$bus->hasCrewMember($user->id)) {
            return response()->json(['message' => 'عذراً، يحق للمشرفة فقط تسجيل الطلاب.'], 403);
        }

        $trip = $this->getActiveTrip($bus);
        if (!$trip) {
            return response()->json(['message' => 'يجب بدء الرحلة أولاً.'], 422);
        }

        // استخراج الكود بمرونة وبدون مسافات/رموز إضافية (مثل أسطر جديدة أو فراغات)
        $code = trim($request->code);
        $code = str_ireplace('STUDENT-', '', $code);
        $code = trim($code);
        $student = Student::where('student_code', $code)->orWhere('national_id', $code)->first();

        if (!$student) {
            return response()->json([
                'message' => 'الطالب غير مسجل في النظام.',
                'error_code' => 'not_found'
            ], 404);
        }

        // دمج student_id في الطلب الحقيقي لتمريره للدوال الموجودة مسبقاً
        $request->merge(['student_id' => $student->id]);

        $direction = $trip->type === 'forth' ? 'to_school' : 'to_home';

        // ══════════════════════════════════════════════════════════
        // التحقق من تخصيص الطالب لهذا الباص في هذا الاتجاه
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
            $tripLabel = $tripType === 'morning' ? 'الذهاب' : 'العودة';
            return response()->json([
                'message' => "الطالب غير مخصص لهذا الباص في رحلة {$tripLabel}.",
                'error_code' => 'not_assigned',
                'student_name' => $student->full_name,
            ], 422);
        }

        $currentStatus = $this->getStudentCurrentStatus($student, $trip);

        // حماية الـ Cooldown (تجميد لمدة دقيقة لمنع التكرار السريع وتغيير الحالة الخطأ)
        $lastAttendance = TripAttendance::where('trip_id', $trip->id)
            ->where('student_id', $student->id)
            ->orderBy('updated_at', 'desc')
            ->first();

        if ($lastAttendance && (int) abs($lastAttendance->updated_at->diffInSeconds(now(), false)) < 60) {
             return response()->json([
                 'message' => 'تم مسح الكود مسبقاً، يرجى الانتظار.',
                 'error_code' => 'cooldown',
                 'current_status' => $currentStatus,
                 'student_name' => $student->full_name,
             ], 429);
        }

        // ══════════════════════════════════════════════════════════
        // آلة الحالة (State Machine)
        // المسح الذكي يسجل ركوب ونزول، لكن النزول يُسمح به فقط
        // بعد اكتمال ركوب/تحضير جميع الطلاب المخصصين للباص
        // ══════════════════════════════════════════════════════════

        $expectedInitial = $direction === 'to_school' ? 'atHome' : 'atSchool';

        if ($currentStatus === $expectedInitial || $currentStatus === 'waiting') {
            // ✅ الطالب لم يركب بعد → تسجيل ركوب
            $response = $this->markBoarded($request, $bus);

        } elseif ($currentStatus === 'onBus') {
            // الطالب راكب بالفعل → هل اكتمل ركوب/تحضير جميع طلاب الباص؟
            // ① حساب العدد الحقيقي للطلاب المخصصين لهذا الباص
            $busColumn = $tripType === 'morning' ? 'forth_bus_id' : 'back_bus_id';
            $totalAssigned = Student::where('is_active', true)
                ->where($busColumn, $bus->id)
                ->count();

            // ② حساب عدد الطلاب الذين تم تحضيرهم (ركوب/غياب/استئذان)
            $processedCount = TripAttendance::where('trip_id', $trip->id)
                ->whereIn('status', ['boarded', 'dropped', 'absent', 'excused'])
                ->count();

            if ($processedCount >= $totalAssigned && $totalAssigned > 0) {
                // ✅ جميع الطلاب تم تحضيرهم → سماح بالنزول
                $response = $this->markDropped($request, $bus);
            } else {
                // ⛔ لا يزال هناك طلاب لم يركبوا
                $remaining = $totalAssigned - $processedCount;
                return response()->json([
                    'message' => "الطالب راكب في الحافلة بالفعل. لا يزال هناك {$remaining} طالب لم يتم تحضيرهم.",
                    'error_code' => 'already_boarded',
                    'current_status' => 'onBus',
                    'student_name' => $student->full_name,
                    'remaining_count' => $remaining,
                ], 409);
            }

        } else {
            // ⛔ الطالب وصل مسبقاً (atSchool أو atHome بعد النزول)
            return response()->json([
                'message' => 'الطالب مسجل وصوله مسبقاً.',
                'error_code' => 'already_processed',
                'current_status' => $currentStatus,
                'student_name' => $student->full_name,
            ], 409);
        }

        // إضافة بيانات الطالب للاستجابة لتحديث الواجهة في التطبيق
        $responseData = json_decode($response->getContent(), true);
        $responseData['student_name'] = $student->full_name;
        $responseData['student_id'] = (string) $student->id;
        
        return response()->json($responseData, $response->getStatusCode());
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
        $newlyBoardedStudentIds = [];
        DB::transaction(function () use ($validStudentIds, $trip, $recordedAt, &$newlyBoardedStudentIds) {
            foreach ($validStudentIds as $studentId) {
                $alreadyBoarded = TripAttendance::where('trip_id', $trip->id)
                    ->where('student_id', $studentId)
                    ->where('status', 'boarded')
                    ->exists();
                
                if (!$alreadyBoarded) {
                    $newlyBoardedStudentIds[] = $studentId;
                    
                    $existing = TripAttendance::where('trip_id', $trip->id)->where('student_id', $studentId)->first();
                    $extraWaitTime = 0;
                    if ($existing && $existing->status === 'waiting' && $existing->waiting_start_time) {
                        $waitingSeconds = (int) abs($recordedAt->diffInSeconds($existing->waiting_start_time, false));
                        if ($waitingSeconds > 120) {
                            $extraWaitTime = $waitingSeconds - 120;
                        }
                    }

                    TripAttendance::updateOrCreate(
                        ['trip_id' => $trip->id, 'student_id' => $studentId],
                        [
                            'check_in_time' => $recordedAt,
                            'status' => 'boarded',
                            'extra_wait_time' => $extraWaitTime,
                        ]
                    );
                }
            }
        });

        // Notifications & broadcasts only for newly boarded students
        foreach ($newlyBoardedStudentIds as $studentId) {
            $student = Student::find($studentId);
            if (!$student) continue;

            $notificationType = $direction === 'to_home' ? 'bus_boarding_afternoon' : 'bus_boarding_morning';
            $studentNameEn = !empty($student->full_name_en) ? $student->full_name_en : $student->full_name;

            foreach ($student->guardians as $guardian) {
                $notification = $this->notificationService->sendTranslatedToUser(
                    userId: $guardian->id,
                    type: $notificationType,
                    titleKey: 'notifications.student_status_title',
                    messageKey: 'notifications.student_picked_up',
                    translationParams: ['student' => $student->full_name],
                    data: [
                        'notification_type' => $notificationType,
                        'student_id' => $studentId,
                        'student_name_en' => $studentNameEn,
                        'bus_id' => $bus->id,
                        'direction' => $direction,
                        'category' => 'bus_tracking',
                        'target_screen' => 'children_status',
                    ],
                    fromUserName: 'نظام النقل',
                    translationParamsEn: ['student' => $studentNameEn]
                );

                // 📢 Sync Real-time UI
                event(new \App\Events\NotificationPushed($notification, $guardian->id));
            }

            try {
                broadcast(new StudentStatusUpdated($student, $bus, 'boarding', $direction));
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
        $currentStatus = $this->getStudentCurrentStatus($student, $trip);
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
        $isAlreadyDropped = TripAttendance::where('trip_id', $trip->id)
            ->where('student_id', $student->id)
            ->where('status', 'dropped')
            ->exists();

        if ($isAlreadyDropped) {
            return response()->json([
                'message' => 'تم تسجيل النزول بالفعل لهذه الرحلة.',
                'current_status' => $expectedNewStatus,
            ], 200);
        }

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
        $student->loadMissing('guardians');
        foreach ($student->guardians as $guardian) {
            $studentNameEn = !empty($student->full_name_en) ? $student->full_name_en : $student->full_name;

            $this->notificationService->sendTranslatedToUser(
                userId: $guardian->id,
                type: 'student_alighted',
                titleKey: 'notifications.student_status_title',
                messageKey: 'notifications.student_dropped_off',
                translationParams: ['student' => $student->full_name],
                data: [
                    'attendance_id'   => $attendance->id,
                    'bus_id'          => $bus->id,
                    'student_id'      => $student->id,
                    'student_name_en' => $studentNameEn,
                    'direction'       => $direction,
                    'type'            => 'student_alighted',
                    'category' => 'student_tracking',
                    'target_screen'   => 'children_status',
                ],
                fromUserName: 'نظام النقل',
                translationParamsEn: ['student' => $studentNameEn]
            );
        }

        return response()->json([
            'message' => 'تم تسجيل نزول الطالب بنجاح.',
            'new_status' => $expectedNewStatus,
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
        $newlyDroppedStudentIds = [];
        DB::transaction(function () use ($request, $trip, $recordedAt, &$newlyDroppedStudentIds) {
            foreach ($request->student_ids as $studentId) {
                $alreadyDropped = TripAttendance::where('trip_id', $trip->id)
                    ->where('student_id', $studentId)
                    ->where('status', 'dropped')
                    ->exists();

                if (!$alreadyDropped) {
                    $newlyDroppedStudentIds[] = $studentId;
                    TripAttendance::updateOrCreate(
                        ['trip_id' => $trip->id, 'student_id' => $studentId],
                        [
                            'check_out_time' => $recordedAt,
                            'status' => 'dropped',
                        ]
                    );
                }
            }
        });

        // Notifications & broadcasts only for newly dropped students
        foreach ($newlyDroppedStudentIds as $studentId) {
            $student = Student::find($studentId);
            if (!$student) continue;

            $studentNameEn = !empty($student->full_name_en) ? $student->full_name_en : $student->full_name;

            foreach ($student->guardians as $guardian) {
                $this->notificationService->sendTranslatedToUser(
                    userId: $guardian->id,
                    type: 'student_alighted',
                    titleKey: 'notifications.student_status_title',
                    messageKey: 'notifications.student_dropped_off',
                    translationParams: ['student' => $student->full_name],
                    data: [
                        'type' => 'student_alighted',
                        'direction' => $direction,
                        'student_id' => (string) $studentId,
                        'category' => 'student_tracking',
                        'target_screen' => 'children_status',
                    ],
                    fromUserName: 'نظام النقل',
                    translationParamsEn: ['student' => $studentNameEn]
                );
            }

            try {
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

            // Auto-update any remaining pending students to absent
            TripAttendance::where('trip_id', $trip->id)
                ->where('status', 'pending')
                ->update(['status' => 'absent']);

            $trip->update([
                'status' => 'awaiting_video',
                'arrival_time' => $recordedAt,
            ]);
            
            $bus->update([
                'trip_status' => 'idle',
                'target_latitude' => null,
                'target_longitude' => null,
            ]);
        });

        try {
            broadcast(new TripStatusUpdated($trip, $bus, 'awaiting_video'));
        } catch (\Exception $e) {
            Log::error("Broadcast error (arrive trip status): " . $e->getMessage());
        }

        // الإشعارات والبث خارج الـ Transaction (لا يجب أن تمنع الحفظ)
        foreach ($attendances as $attendance) {
            $student = $attendance->student; // The relation should be loaded or accessible, let me check if student relation is used here. Wait! $attendance->student is not loaded explicitly in this view.
            if (!$student) continue;

            $studentNameEn = !empty($student->full_name_en) ? $student->full_name_en : $student->full_name;

            $titleKey = $direction === 'to_school' ? 'notifications.student_alighted_school_title' : 'notifications.student_alighted_home_title';
            $messageKey = $direction === 'to_school' ? 'notifications.student_alighted_school_message' : 'notifications.student_alighted_home_message';

            foreach ($student->guardians as $guardian) {
                $notification = $this->notificationService->sendTranslatedToUser(
                    userId: $guardian->id,
                    type: 'student_alighted',
                    titleKey: $titleKey,
                    messageKey: $messageKey,
                    translationParams: ['student' => $student->full_name],
                    data: [
                        'type' => 'student_alighted',
                        'direction' => $direction,
                        'student_id' => $attendance->student_id,
                        'category' => 'bus_tracking',
                        'target_screen' => 'children_status',
                    ],
                    translationParamsEn: ['student' => $studentNameEn]
                );

                // 📢 Sync Real-time UI
                event(new \App\Events\NotificationPushed($notification, $guardian->id));
            }

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
        $user = $request->user();
        $this->cleanupStaleTrips($bus, $user);

        // تحديد نوع الرحلة المقترح حسب الرحلة النشطة أو المعلقة لهذا اليوم أو غداً
        $activeTrip = Trip::where('bus_id', $bus->id)
            ->whereDate('trip_date', today())
            ->whereIn('status', ['in_progress', 'awaiting_confirmation', 'awaiting_video'])
            ->latest('updated_at')
            ->first();

        if (!$activeTrip) {
            $date = today();
            $activeTrip = Trip::where('bus_id', $bus->id)
                ->whereDate('trip_date', $date)
                ->whereIn('status', ['pending', 'finished'])
                ->orderByRaw("CASE WHEN status = 'pending' THEN 1 ELSE 2 END")
                ->orderBy('updated_at', 'desc')
                ->first();
        }

        if (!$activeTrip) {
            $date = \Carbon\Carbon::tomorrow();
            $activeTrip = Trip::where('bus_id', $bus->id)
                ->whereDate('trip_date', $date)
                ->whereIn('status', ['pending', 'finished'])
                ->orderByRaw("CASE WHEN status = 'pending' THEN 1 ELSE 2 END")
                ->orderBy('updated_at', 'desc')
                ->first();
        }

        if ($activeTrip) {
            $this->tripService->syncTripAttendances($activeTrip);
        }

        $suggestedTripType = $activeTrip?->type === 'back' ? 'afternoon' : 'morning';

        // السماح بطلب نوع رحلة محدد عبر Query Param
        $filterTripType = $request->query('trip_type', $suggestedTripType);

        $query = Student::where('is_active', true)
            ->with(['lastTripAttendance.trip', 'tripAttendances', 'guardian', 'absenceRequests' => function($q) {
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
            if ($activeTrip) {
                $activeAttendance = $student->tripAttendances->firstWhere('trip_id', $activeTrip->id);
                if ($activeAttendance) {
                    $lastAttendance = $activeAttendance;
                }
            }
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
                    if (isset($activeTrip) && (string) $lastAttendance->trip_id === (string) $activeTrip->id) {
                        // Attendance matches the current active trip
                        if ($lastAttendance->status === 'boarded') {
                            $studentStatus = 'onBus';
                        } elseif ($lastAttendance->status === 'dropped') {
                            $studentStatus = ($activeTrip->type === 'forth') ? 'atSchool' : 'atHome';
                        } elseif ($lastAttendance->status === 'waiting') {
                            $studentStatus = 'waiting';
                        } elseif (in_array($lastAttendance->status, ['absent', 'excused'])) {
                            $studentStatus = 'absent';
                        }
                    } else {
                        // Attendance is from a previous trip today (e.g. morning trip)
                        if ($lastAttendance->status === 'dropped' && $lastAttendance->trip?->type === 'forth') {
                            $studentStatus = 'atSchool';
                        } elseif ($lastAttendance->status === 'dropped' && $lastAttendance->trip?->type === 'back') {
                            $studentStatus = 'atHome';
                        } elseif (in_array($lastAttendance->status, ['absent', 'excused'])) {
                            $studentStatus = 'absent';
                        }
                    }
                }
            }

            // Fallback chain for student coordinates
            $parent = $student->guardian->first(fn($g) => $g->latitude && $g->longitude) ?? $student->guardian->first();
            
            $forthLat = $student->forth_latitude ?? $student->latitude ?? $parent?->latitude;
            $forthLng = $student->forth_longitude ?? $student->longitude ?? $parent?->longitude;
            $backLat = $student->back_latitude ?? $student->latitude ?? $parent?->latitude;
            $backLng = $student->back_longitude ?? $student->longitude ?? $parent?->longitude;
            
            $generalLat = $student->latitude ?? $parent?->latitude;
            $generalLng = $student->longitude ?? $parent?->longitude;

            return [
                'id' => (string) $student->id,
                'studentCode' => $student->student_code,
                'name' => $student->full_name ?? $student->name,
                'forth_latitude' => $forthLat,
                'forth_longitude' => $forthLng,
                'back_latitude' => $backLat,
                'back_longitude' => $backLng,
                'latitude' => $generalLat,
                'longitude' => $generalLng,
                'grade' => $student->grade ?? 'متوسط',
                'classroom' => [
                    'id' => $student->currentEnrollment?->classroom_id,
                    'name' => $student->currentEnrollment?->classroom?->name,
                    'school_id' => $student->currentEnrollment?->classroom?->grade?->school_id,
                ],
                'parentName' => $student->guardian->first()?->name ?? 'غير محدد',
                'parentPhone' => $student->guardian->first()?->phone ?? 'غير محدد',
                'parentUserId' => (string) $student->guardian->first()?->id,
                'photoUrl' => $student->image ? (str_starts_with($student->image, 'http') ? $student->image : url(Storage::url($student->image))) : null,
                'status' => $studentStatus, // atHome, onBus, atSchool, absent, waiting
                'isOnBus' => ($studentStatus === 'onBus'),
                'isAbsent' => ($studentStatus === 'absent'),
                'isWaiting' => ($studentStatus === 'waiting'),
                'waitingSince' => ($studentStatus === 'waiting') ? ($lastAttendance->waiting_start_time ? $lastAttendance->waiting_start_time->toIso8601String() : $lastAttendance->updated_at->toIso8601String()) : null,
                'waitingElapsedSeconds' => ($studentStatus === 'waiting') ? (int) abs(now()->diffInSeconds($lastAttendance->waiting_start_time ?? $lastAttendance->updated_at, false)) : 0,
                'has_absence_request' => $student->absenceRequests->isNotEmpty(),
                'behavioralNote' => null, 
                'lastEvent' => ($lastAttendance && in_array($lastAttendance->status, ['boarded', 'waiting', 'dropped'])) ? [
                    'type' => $lastAttendance->status === 'boarded' ? 'boarding' : ($lastAttendance->status === 'waiting' ? 'proximity' : 'alighting'),
                    'direction' => $lastAttendance->trip?->type === 'forth' ? 'to_school' : 'to_home',
                    'time' => $lastAttendance->updated_at->format('H:i'),
                ] : null,
            ];
        });

        // Load driver info with user relation to get real name/phone/photo
        $driver     = $bus->driver()->with('user')->first();
        $driverUser = $driver?->user;
        $driverPhotoUrl = null;
        if ($driverUser && $driverUser->image) {
            $driverPhotoUrl = str_starts_with($driverUser->image, 'http')
                ? $driverUser->image
                : url(\Illuminate\Support\Facades\Storage::url($driverUser->image));
        }

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
            'driver' => [
                'id'    => $driverUser?->id,
                'name'  => $driverUser?->first_name_ar
                            ? trim(($driverUser->first_name_ar ?? '') . ' ' . ($driverUser->last_name_ar ?? ''))
                            : ($driverUser?->name ?? '-'),
                'phone' => $driverUser?->phone ?? '-',
                'photo' => $driverPhotoUrl,
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

        // تنظيف وإلغاء أي رحلات قديمة معلقة أو غير مكتملة من الأيام السابقة تلقائياً لضمان عدم تراكمها
        $this->cleanupStaleTrips($bus, $user);

        // We fetch today's trips, or tomorrow's if none exist for today (in case of night generation)
        $date = today();
        Log::info('myTrips: fetching trips for date ' . $date->toDateString());
        
        $trips = Trip::where('bus_id', $bus->id)
            ->whereDate('trip_date', $date)
            ->get();

        if ($trips->isEmpty()) {
            Log::info('myTrips: no trips for today, checking tomorrow');
            $date = Carbon::tomorrow();
            $trips = Trip::where('bus_id', $bus->id)
                ->whereDate('trip_date', $date)
                ->get();
        }

        // Sync each trip's attendances dynamically to reflect any newly assigned students
        foreach ($trips as $trip) {
            $this->tripService->syncTripAttendances($trip);
        }

        // Re-fetch the trips with counts and route relations after synchronization
        $trips = Trip::with('route')
            ->withCount(['attendances as total_students', 'attendances as excused_count' => function ($query) {
                $query->where('status', 'excused');
            }])
            ->where('bus_id', $bus->id)
            ->whereDate('trip_date', $date)
            ->orderBy('type') // forth then back
            ->get();

        $acceptLanguage = $request->header('Accept-Language') ?? '';
        $isEn = (str_starts_with($acceptLanguage, 'en') 
            || $request->input('lang') === 'en' 
            || app()->getLocale() === 'en'
            || ($user && $user->preferred_language === 'en'));

        $formattedTrips = $trips->map(function ($trip) use ($isEn) {
            $routeName = $trip->route ? $trip->route->name : null;
            if ($isEn && $routeName) {
                $routeName = str_replace(['المسار رقم', 'مسار رقم', 'مسار'], ['Route No.', 'Route No.', 'Route'], $routeName);
            }

            return [
                'id' => $trip->id,
                'type' => $trip->type,
                'type_label' => $isEn ? ($trip->type === 'forth' ? 'Go' : 'Return') : ($trip->type === 'forth' ? 'ذهاب' : 'عودة'),
                'status' => $trip->status,
                'total_students' => $trip->total_students,
                'excused_count' => $trip->excused_count,
                'departure_time' => $trip->departure_time,
                'arrival_time' => $trip->arrival_time,
                'route' => $trip->route ? [
                    'id' => $trip->route->id,
                    'name' => $routeName,
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
        
        $acceptLanguage = $request->header('Accept-Language') ?? '';
        $isEn = (str_starts_with($acceptLanguage, 'en') 
            || $request->input('lang') === 'en' 
            || app()->getLocale() === 'en'
            || ($user && $user->preferred_language === 'en'));

        $formattedTrips = $trips->getCollection()->map(function ($trip) use ($isEn) {
            $routeName = $trip->route ? $trip->route->name : null;
            if ($isEn && $routeName) {
                $routeName = str_replace(['المسار رقم', 'مسار رقم', 'مسار'], ['Route No.', 'Route No.', 'Route'], $routeName);
            }

            return [
                'id' => $trip->id,
                'type' => $trip->type,
                'type_label' => $isEn ? ($trip->type === 'forth' ? 'Go' : 'Return') : ($trip->type === 'forth' ? 'ذهاب' : 'عودة'),
                'status' => $trip->status,
                'trip_date' => $trip->trip_date->toDateString(),
                'total_students' => $trip->total_students,
                'departure_time' => $trip->departure_time,
                'arrival_time' => $trip->arrival_time,
                'route' => $trip->route ? [
                    'id' => $trip->route->id,
                    'name' => $routeName,
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

        $request->validate([
            'latitude'  => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        if ($request->filled('latitude') && $request->filled('longitude')) {
            $bus->update([
                'latitude'  => $request->latitude,
                'longitude' => $request->longitude,
                'last_location_update' => now(),
            ]);
            Log::info('startTrip: Bus location updated at trip start request', [
                'bus_id' => $bus->id,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
            ]);
        }

        // 1. تنظيف وإلغاء أي رحلات معلقة أو نشطة من الأيام السابقة تلقائياً للحفاظ على سلامة البيانات ومنع التراكمات
        $this->cleanupStaleTrips($bus, $user);

        // 2. التحقق من عدم وجود رحلة نشطة أخرى لليوم الحالي فقط
        $activeTrip = Trip::where('bus_id', $bus->id)
            ->whereDate('trip_date', today())
            ->whereIn('status', ['in_progress', 'awaiting_confirmation', 'awaiting_video'])
            ->first();

        if ($activeTrip) {
            return response()->json([
                'message' => 'هناك رحلة نشطة بالفعل أو بانتظار التأكيد/الفيديو اليوم. يرجى إنهاء الرحلة السابقة أولاً.'
            ], 422);
        }

        // 2. البحث عن أول رحلة غير منتهية لهذا اليوم (ذهاب أولاً)
        $trip = Trip::where('bus_id', $bus->id)
            ->whereDate('trip_date', today())
            ->where('status', 'pending')
            ->orderByRaw("CASE WHEN type = 'forth' THEN 1 WHEN type = 'back' THEN 2 ELSE 3 END")
            ->first();

        if (!$trip) {
            return response()->json(['message' => 'لا توجد رحلة معلقة لبدءها اليوم.'], 404);
        }

        // Sync attendances first
        $this->tripService->syncTripAttendances($trip);

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

        // Find the trip: either by ID or first awaiting confirmation
        $tripId = $request->trip_id;
        if ($tripId) {
            $trip = Trip::where('id', $tripId)
                ->where('bus_id', $bus->id)
                ->firstOrFail();
        } else {
            $trip = Trip::where('bus_id', $bus->id)
                ->where('status', 'awaiting_confirmation')
                ->first();
            
            if (!$trip) {
                return response()->json(['message' => 'لا توجد رحلة بانتظار التأكيد.'], 404);
            }
        }

        if ($trip->status !== 'awaiting_confirmation' && $trip->status !== 'pending') {
            return response()->json(['message' => 'هذه الرحلة لا تنتظر التأكيد.'], 422);
        }

        // Sync attendances on confirmation
        $this->tripService->syncTripAttendances($trip);

        DB::transaction(function () use ($trip, $bus) {
            $trip->update([
                'status' => 'in_progress',
                'departure_time' => now(),
            ]);

            // Set memory attributes to null to force dynamic calculation
            $bus->setAttribute('target_latitude', null);
            $bus->setAttribute('target_longitude', null);

            $bus->update([
                'trip_status' => 'in_progress',
                'target_latitude' => $bus->target_latitude,
                'target_longitude' => $bus->target_longitude,
            ]);
        });

        try {
            broadcast(new TripStatusUpdated($trip, $bus, 'in_progress'));
        } catch (\Exception $e) {
            Log::error("Broadcast error (confirm trip status): " . $e->getMessage());
        }

        $this->notifyGuardiansTripStarted($bus, $trip);

        Log::info('confirmTrip: Trip confirmed by assistant', ['bus_id' => $bus->id, 'trip_id' => $trip->id, 'confirmed_by' => $user->id]);

        return response()->json([
            'message' => 'تم تأكيد بدء الرحلة.',
            'trip_id' => $trip->id,
            'status' => 'in_progress',
            'departure_time' => $trip->departure_time,
        ]);
    }

    /**
     * إرسال إشعارات لجميع أولياء الأمور عند بدء الرحلة
     */
    protected function notifyGuardiansTripStarted(Bus $bus, Trip $trip)
    {
        // ✅ T-07: إشعار جميع أولياء أمور طلاب الحافلة ببدء الرحلة
        $students = Student::with('guardians')
            ->where('is_active', true)
            ->where(function($q) use ($bus, $trip) {
                if ($trip->type === 'forth') {
                    $q->where('forth_bus_id', $bus->id);
                } else {
                    $q->where('back_bus_id', $bus->id);
                }
            })
            ->get();

        Log::info("🚌 Trip Started: Bus ID {$bus->id}, Type {$trip->type}. Found " . $students->count() . " active students assigned to this bus.");

        // Group by guardian to send one notification per parent
        $guardianData = [];
        foreach ($students as $student) {
            foreach ($student->guardians as $guardian) {
                $guardianData[$guardian->id]['user'] = $guardian;
                $guardianData[$guardian->id]['students'][] = $student;
            }
        }

        $messageKey = $trip->type === 'forth' ? 'notifications.trip_started_forth' : 'notifications.trip_started_back';
        $direction = $trip->type === 'forth' ? 'to_school' : 'to_home';

        foreach ($guardianData as $guardianId => $data) {
            $guardian = $data['user'];
            $guardianStudents = collect($data['students']);

            // تحديد أسماء الطلاب باللغتين
            $studentNamesAr = $guardianStudents->map(fn($s) => $s->full_name)->implode('، ');
            $studentNamesEn = $guardianStudents->map(fn($s) => $s->full_name_en)->implode(', ');

            $this->notificationService->sendTranslatedToUser(
                userId: $guardianId,
                type: 'trip_started',
                titleKey: 'notifications.trip_started_title',
                messageKey: $messageKey,
                translationParams: ['students' => $studentNamesAr],
                data: [
                    'trip_id' => (string) $trip->id,
                    'type' => 'trip_started',
                    'direction' => $direction,
                    'category' => 'bus_tracking',
                    'target_screen' => 'map_page',
                ],
                fromUserName: 'نظام النقل',
                translationParamsEn: ['students' => $studentNamesEn]
            );
        }
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

        // 1. تحديث الحالة في قاعدة البيانات إلى "waiting" (داخل Transaction لضمان تكامل البيانات)
        $trip = $this->getActiveTrip($bus);
        if ($trip) {
            DB::transaction(function () use ($trip, $student) {
                TripAttendance::updateOrCreate(
                    ['trip_id' => $trip->id, 'student_id' => $student->id],
                    [
                        'status' => 'waiting',
                        'waiting_start_time' => now(),
                        'extra_wait_time' => 0,
                    ]
                );
            });
        }

        $studentNameEn = !empty($student->full_name_en) ? $student->full_name_en : $student->full_name;

        // 2. إرسال الإشعار لولي الأمر (Push Notification)
        $isBack = $trip && $trip->type === 'back';
        $messageKey = $isBack ? 'notifications.bus_approaching_back_message' : 'notifications.bus_approaching_message';

        foreach ($student->guardians as $guardian) {
            $this->notificationService->sendTranslatedToUser(
                userId: $guardian->id,
                type: 'bus_approaching',
                titleKey: 'notifications.bus_approaching_title',
                messageKey: $messageKey,
                translationParams: ['student' => $student->full_name],
                data: [
                    'type'              => 'bus_approaching',
                    'notification_type' => 'bus_approaching',
                    'bus_id'            => $bus->id,
                    'bus_number'        => $bus->bus_number,
                    'student_id'        => $student->id,
                    'student_name_en'   => $studentNameEn,
                    'category' => 'bus_tracking',
                    'target_screen'     => 'map_page',
                ],
                fromUserName: 'نظام النقل',
                translationParamsEn: ['student' => $studentNameEn]
            );
        }

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
            $recordedAt = now();
            $existing = TripAttendance::where('trip_id', $trip->id)->where('student_id', $request->student_id)->first();
            $extraWaitTime = 0;
            if ($existing && $existing->status === 'waiting' && $existing->waiting_start_time) {
                $waitingSeconds = (int) abs($recordedAt->diffInSeconds($existing->waiting_start_time, false));
                if ($waitingSeconds > 120) {
                    $extraWaitTime = $waitingSeconds - 120;
                }
            }

            return TripAttendance::updateOrCreate(
                ['trip_id' => $trip->id, 'student_id' => $request->student_id],
                [
                    'status' => 'absent',
                    'extra_wait_time' => $extraWaitTime,
                ]
            );
        });

        $student = Student::find($request->student_id);
        
        $studentNameEn = !empty($student->full_name_en) ? $student->full_name_en : $student->full_name;

        // Notify parent
        foreach ($student->guardians as $guardian) {
            $this->notificationService->sendTranslatedToUser(
                userId: $guardian->id,
                type: 'student_absent',
                titleKey: 'notifications.student_absent_title',
                messageKey: 'notifications.student_absent_message',
                translationParams: ['student' => $student->full_name],
                data: [
                    'type'          => 'student_absent',
                    'student_id'    => $student->id,
                    'category' => 'bus_tracking',
                    'target_screen' => 'map_page',
                ],
                fromUserName: 'نظام النقل',
                translationParamsEn: ['student' => $studentNameEn]
            );
        }

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

        $startValid = ($startQr === $expectedStart) || 
                      ($bus->bus_number && $startQr === "FRONT-" . strtoupper(trim($bus->bus_number))) ||
                      ($bus->plate_number && $startQr === "FRONT-" . strtoupper(trim($bus->plate_number)));

        $endValid = ($endQr === $expectedEnd) || 
                    ($bus->bus_number && $endQr === "BACK-" . strtoupper(trim($bus->bus_number))) ||
                    ($bus->plate_number && $endQr === "BACK-" . strtoupper(trim($bus->plate_number))) ||
                    str_contains($endQr, 'MANUAL');

        Log::info('QR Validation Debug:', [
            'bus_id' => $bus->id,
            'received_start' => $startQr,
            'received_end' => $endQr,
            'start_valid' => $startValid,
            'end_valid' => $endValid,
            'expected_start' => $expectedStart,
            'expected_end' => $expectedEnd,
        ]);

        if (!$startValid || !$endValid) {
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
        // Count from trip_attendances directly to be robust against mid-day student assignment changes
        $totalAssigned = TripAttendance::where('trip_id', $trip->id)->count();

        // Accounted for = students who are in a processed/finalized state
        // Morning: Boarded, Dropped, Absent, Excused, or Waiting are all 'processed' (boarded is auto-dropped on finish)
        // Afternoon: Dropped, Absent, or Excused are 'processed'
        $accountedFor = TripAttendance::where('trip_id', $trip->id)
            ->where(function($query) use ($tripType) {
                if ($tripType === 'forth') {
                    $query->whereIn('status', ['boarded', 'dropped', 'absent', 'excused', 'waiting']);
                } else {
                    $query->whereIn('status', ['dropped', 'absent', 'excused']);
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
                    $boardedAttendances = TripAttendance::where('trip_id', $trip->id)
                        ->where('status', 'boarded')
                        ->with('student')
                        ->get();

                    foreach ($boardedAttendances as $attendance) {
                        if ($attendance->student) {
                            try {
                                broadcast(new StudentStatusUpdated($attendance->student, $bus, 'alight', 'to_school'));
                            } catch (\Exception $e) {
                                Log::error("Broadcast error (end trip student alight): " . $e->getMessage());
                            }
                        }
                    }

                    TripAttendance::where('trip_id', $trip->id)
                        ->where('status', 'boarded')
                        ->update([
                            'status' => 'dropped',
                            'check_out_time' => now()
                        ]);
                }

                // Auto-update any remaining pending students to absent
                $pendingAttendances = TripAttendance::where('trip_id', $trip->id)
                    ->where('status', 'pending')
                    ->with('student')
                    ->get();

                foreach ($pendingAttendances as $attendance) {
                    if ($attendance->student) {
                        try {
                            broadcast(new StudentStatusUpdated($attendance->student, $bus, 'absent', $tripType === 'forth' ? 'to_school' : 'to_home'));
                        } catch (\Exception $e) {
                            Log::error("Broadcast error (end trip student absent): " . $e->getMessage());
                        }
                    }
                }

                TripAttendance::where('trip_id', $trip->id)
                    ->where('status', 'pending')
                    ->update(['status' => 'absent']);

                $trip->update([
                    'status' => 'finished',
                    'arrival_time' => now(),
                    'video_check' => true,
                    'video_path' => $path,
                    'end_qr_scanned_at' => now(),
                ]);

                $bus->update([
                    'trip_status' => 'idle',
                    'target_latitude' => null,
                    'target_longitude' => null,
                ]);
                
                try {
                    broadcast(new TripStatusUpdated($trip, $bus, 'finished'));
                } catch (\Exception $e) {
                    Log::error("Broadcast error (end trip status): " . $e->getMessage());
                }

                // Notify assistant to trigger app refresh/close trip view
                if ($bus->assistant_id) {
                    $this->notificationService->sendTranslatedToUser(
                        userId: $bus->assistant_id,
                        type: 'trip_finished',
                        titleKey: 'notifications.trip_finished_title',
                        messageKey: 'notifications.trip_finished_message',
                        data: [
                            'trip_id' => (string)$trip->id,
                            'bus_id' => (string)$bus->id,
                            'status' => 'finished',
                            'type' => 'trip_finished',
                            'category' => 'bus_tracking',
                            'target_screen' => 'map_page',
                        ]
                    );
                }
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
    private function getStudentCurrentStatus(Student $student, Trip $activeTrip = null): string
    {
        // إذا كانت هناك رحلة نشطة، نبحث فقط في سجلات هذه الرحلة
        if ($activeTrip) {
            $attendance = TripAttendance::where('trip_id', $activeTrip->id)
                ->where('student_id', $student->id)
                ->first();

            if (!$attendance) {
                // لا يوجد سجل في الرحلة الحالية → الطالب في حالته الابتدائية
                return $activeTrip->type === 'forth' ? 'atHome' : 'atSchool';
            }

            if ($attendance->status === 'boarded') {
                return 'onBus';
            }

            if ($attendance->status === 'waiting') {
                return 'waiting';
            }

            if ($attendance->status === 'dropped') {
                // نزل فعلاً → وصل إلى الوجهة
                return $activeTrip->type === 'forth' ? 'atSchool' : 'atHome';
            }

            // absent أو excused → الطالب لم يركب فعلياً، يُسمح بالركوب إذا حضر متأخراً
            return $activeTrip->type === 'forth' ? 'atHome' : 'atSchool';
        }

        // لا توجد رحلة نشطة → نستخدم آخر سجل عام (للعرض في القوائم فقط)
        $lastAttendance = $student->lastTripAttendance;

        if (!$lastAttendance) {
            return 'atHome';
        }

        if ($lastAttendance->status === 'boarded') {
            return 'onBus';
        }

        if ($lastAttendance->status === 'waiting') {
            return 'waiting';
        }

        return $lastAttendance->trip?->type === 'forth' ? 'atSchool' : 'atHome';
    }

    private function getActiveTrip(Bus $bus)
    {
        return Trip::where('bus_id', $bus->id)
            ->whereDate('trip_date', today())
            ->where('status', 'in_progress')
            ->latest('updated_at')
            ->first();
    }

    /**
     * تنظيف وإلغاء أي رحلات قديمة معلقة أو نشطة من الأيام السابقة تلقائياً للحفاظ على سلامة البيانات ومنع التراكمات
     */
    private function cleanupStaleTrips(Bus $bus, $user)
    {
        $staleTripsCount = Trip::where('bus_id', $bus->id)
            ->whereDate('trip_date', '<', today())
            ->whereIn('status', ['pending', 'in_progress', 'awaiting_confirmation', 'awaiting_video'])
            ->count();

        if ($staleTripsCount > 0) {
            Log::info("cleanupStaleTrips: Found $staleTripsCount stale trips for bus {$bus->id}. Cleaning up.");
            
            // 1. الرحلات التي بدأت ولكن لم يتم إنهاؤها أو تصويرها للتأكد من خلوها من الطلاب (in_progress, awaiting_video)
            Trip::where('bus_id', $bus->id)
                ->whereDate('trip_date', '<', today())
                ->whereIn('status', ['in_progress', 'awaiting_video'])
                ->update([
                    'status' => 'cancelled',
                    'cancellation_reason' => 'لم يتم مسح الحافلة للتأكد من خلوها من الطلاب',
                    'cancelled_by' => $user->id,
                ]);

            // 2. الرحلات التي لم تبدأ أصلاً ومازالت قيد الانتظار (pending, awaiting_confirmation)
            Trip::where('bus_id', $bus->id)
                ->whereDate('trip_date', '<', today())
                ->whereIn('status', ['pending', 'awaiting_confirmation'])
                ->update([
                    'status' => 'cancelled',
                    'cancellation_reason' => 'أغلقت تلقائياً لعدم بدء الرحلة',
                    'cancelled_by' => $user->id,
                ]);

            if ($bus->trip_status !== 'idle') {
                $bus->update(['trip_status' => 'idle']);
            }
        }
    }
}

