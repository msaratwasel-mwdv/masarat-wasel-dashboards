<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Storage;

class ParentController extends Controller
{
    public function __construct(protected NotificationService $notificationService) {}
    /**
     * GET /api/parent/profile
     * يعيد بيانات الملف الشخصي لولي الأمر
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        $imageUrl = null;
        if ($user->image) {
            $imageUrl = str_starts_with($user->image, 'http')
                ? $user->image
                : url(Storage::url($user->image));
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'id'          => $user->id,
                'name'        => $user->name,
                'name_en'     => $user->name_en,
                'national_id' => $user->national_id,
                'email'       => $user->email,
                'phone'       => $user->phone,
                'role'        => $user->role,
                'image_url'   => $imageUrl,
                'address'     => $user->address,
            ],
        ]);
    }

    /**
     * POST /api/parent/profile/update
     * تحديث بيانات ولي الأمر (الهاتف، البريد)
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        $user = $request->user();
        $user->update($request->only(['phone', 'email']));

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث البيانات بنجاح.',
        ]);
    }

    /**
     * POST /api/parent/profile/avatar
     * رفع صورة شخصية جديدة لولي الأمر
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $user = $request->user();

        // حذف الصورة القديمة إن وجدت
        if ($user->image && !str_starts_with($user->image, 'http')) {
            Storage::disk('public')->delete($user->image);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['image' => $path]);

        $imageUrl = url(Storage::url($path));

        return response()->json([
            'success'   => true,
            'message'   => 'تم تحديث الصورة بنجاح.',
            'image_url' => $imageUrl,
        ]);
    }

    /**
     * GET /api/parent/children
     * يعيد قائمة أبناء ولي الأمر المسجل دخوله
     */
    public function children(Request $request): JsonResponse
    {
        $user = $request->user();

        // جلب طلاب ولي الأمر مع بياناتهم الكاملة
        $students = $user->students()
            ->where('is_active', true)
            ->withCount('trips')
            ->with([
                'tripAttendances',
                'forthBus.route', 
                'backBus.route',
                'forthBus.driver.user',
                'backBus.driver.user',
                'forthBus.assistant',
                'backBus.assistant',
                'lastBusLog',
                'currentEnrollment.classroom.school'
            ])
            ->get();

        $data = $students->map(function (Student $student) use ($user) {
            // بيانات الباص الصباحي والمسائي
            $morningBus = $student->morningGroup?->bus;
            $eveningBus = $student->afternoonGroup?->bus ?? $morningBus;

            // تحديد الباص النشط بناءً على حالة الرحلة
            // إذا كان الباص المسائي في رحلة نشطة، نعرضه. وإلا نعرض الصباحي.
            $activeBus = $morningBus; // الافتراضي
            if ($eveningBus && in_array($eveningBus->trip_status, ['to_home', 'on_route']) && now()->hour >= 11) {
                $activeBus = $eveningBus;
            } elseif ($morningBus && in_array($morningBus->trip_status, ['to_school', 'on_route'])) {
                $activeBus = $morningBus;
            }

            // رابط الصورة
            $imageUrl = null;
            if ($student->image) {
                $imageUrl = str_starts_with($student->image, 'http')
                    ? $student->image
                    : url(Storage::url($student->image));
            }

            // نسبة الحضور
            $totalAttendances = $student->tripAttendances->count();
            $presentCount = $student->tripAttendances->whereIn('status', ['present', 'boarded'])->count();
            $attendancePercentage = $totalAttendances > 0 
                ? round(($presentCount / $totalAttendances) * 100) 
                : 0;

            // تحديد الحالة الحالية للطالب
            $lastLog = $student->lastBusLog;
            $studentStatus = 'atHome';
            if ($lastLog) {
                if ($lastLog->type === 'boarding') {
                    $studentStatus = 'onBus';
                } elseif ($lastLog->type === 'alighting') {
                    $studentStatus = ($lastLog->direction === 'to_school') ? 'atSchool' : 'atHome';
                }
            }

            // اقتراح اتجاه الرحلة بناءً على حالة الباص
            $suggestedDirection = ($activeBus && in_array($activeBus->trip_status, ['to_home'])) ? 'to_home' : 'to_school';

            return [
                'id'           => $student->id,
                'name'         => $student->full_name,
                'name_en'      => $student->full_name_en,
                'national_id'  => $student->national_id,
                'gender'       => $student->gender,
                'student_code' => $student->student_code,
                'status'       => $studentStatus,
                'suggested_direction' => $suggestedDirection,
                'grade'                  => $student->grade ?? 'غير محدد',
                'trip_count'             => $student->trips_count ?? 0,
                'attendance_percentage'  => $attendancePercentage,
                'image_url'              => $imageUrl,
                'home_lat'               => $user->latitude,
                'home_lng'               => $user->longitude,
                'school'      => $student->currentEnrollment?->classroom?->school ? [
                    'id'      => $student->currentEnrollment->classroom->school->id,
                    'name'    => $student->currentEnrollment->classroom->school->name,
                    'location' => $student->currentEnrollment->classroom->school->address,
                ] : null,
                'bus' => $activeBus ? [
                    'id'           => $activeBus->id,
                    'bus_number'   => $activeBus->bus_number,
                    'plate_number' => $activeBus->plate_number,
                    'trip_status'  => $activeBus->trip_status,
                    'driver' => $activeBus->driver && $activeBus->driver->user ? [
                        'id'    => $activeBus->driver->user->id,
                        'name'  => $activeBus->driver->user->name,
                        'phone' => $activeBus->driver->user->phone,
                        'image_url' => $activeBus->driver->user->image ? (str_starts_with($activeBus->driver->user->image, 'http') ? $activeBus->driver->user->image : url(Storage::url($activeBus->driver->user->image))) : null,
                    ] : null,
                    'supervisor' => $activeBus->assistant ? [
                        'id'    => $activeBus->assistant->id,
                        'name'  => $activeBus->assistant->name,
                        'phone' => $activeBus->assistant->phone,
                        'image_url' => $activeBus->assistant->image ? (str_starts_with($activeBus->assistant->image, 'http') ? $activeBus->assistant->image : url(Storage::url($activeBus->assistant->image))) : null,
                    ] : null,
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    /**
     * GET /api/parent/children/{id}/attendance
     * يعيد سجل الحضور للطالب في شهر معين (حسب جدول Attendance الخاص بالمدرسة)
     */
    public function childAttendance(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        // التحقق من أن الطالب يتبع لولي الأمر
        $student = $user->students()
            ->where('student_id', $id)
            ->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'الطالب غير موجود أو لا يتبع لك.',
            ], 404);
        }

        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        $attendances = \App\Models\Attendance::where('student_id', $student->id)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get();

        $logs = [];
        $presentCount = 0;
        $absentCount = 0;

        foreach ($attendances as $att) {
            $logs[$att->date->format('Y-m-d')] = [
                'status' => $att->status,
                'label' => $att->status === 'present' ? 'حاضر' : 'غياب',
            ];

            if ($att->status === 'present') {
                $presentCount++;
            } elseif ($att->status === 'absent') {
                $absentCount++;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'present_days' => $presentCount,
                    'absent_days' => $absentCount,
                ],
                'logs' => $logs,
            ]
        ]);
    }

    /**
     * POST /api/parent/absence-requests
     * إرسال طلب غياب جديد
     */
    public function storeAbsenceRequest(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'date'       => 'required|date|after_or_equal:today',
            'type'       => 'required|in:full_day,morning,afternoon',
            'reason'     => 'nullable|string|max:1000',
        ]);

        $user = $request->user();

        // التأكد أن الطالب يتبع لولي الأمر
        $student = $user->students()
            ->where('student_id', $request->student_id)
            ->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'الطالب غير موجود أو لا يتبع لك.',
            ], 404);
        }

        // منع تكرار الطلب لنفس اليوم
        $exists = \App\Models\AbsenceRequest::where('student_id', $student->id)
            ->where('date', $request->date)
            ->where('status', '!=', 'rejected')
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'يوجد طلب غياب مسجل بالفعل لهذا اليوم.',
            ], 422);
        }

        $absenceRequest = \App\Models\AbsenceRequest::create([
            'student_id'  => $student->id,
            'guardian_id' => $user->id,
            'date'        => $request->date,
            'type'        => $request->type,
            'reason'      => $request->reason,
            'status'      => 'pending',
        ]);

        // ── إرسال إشعار فوري وتفصيلي (إدارة + طاقم) ──
        try {
            $student->load(['school', 'forthBus.driver', 'forthBus.assistant', 'backBus.driver', 'backBus.assistant']);
            $staffUserIds = [];

            // 1. جلب مديري المدرسة (School Admins)
            $schoolAdmins = \App\Models\User::withRole('school_admin')
                ->whereHas('schoolAdmin', function($q) use ($student) {
                    $q->where('school_id', $student->school_id);
                })->pluck('id')->toArray();
            
            $staffUserIds = array_merge($staffUserIds, $schoolAdmins);

            // 2. جلب طاقم الحافلة (سائق ومساعدة) حسب نوع الرحلة
            if ($request->type === 'full_day' || $request->type === 'morning') {
                if ($student->forthBus) {
                    if ($student->forthBus->driver) $staffUserIds[] = $student->forthBus->driver->user_id;
                    if ($student->forthBus->assistant) $staffUserIds[] = $student->forthBus->assistant->id;
                }
            }

            if ($request->type === 'full_day' || $request->type === 'afternoon') {
                if ($student->backBus) {
                    if ($student->backBus->driver) $staffUserIds[] = $student->backBus->driver->user_id;
                    if ($student->backBus->assistant) $staffUserIds[] = $student->backBus->assistant->id;
                }
            }

            $staffUserIds = array_unique(array_filter($staffUserIds));

            $typeName = [
                'morning'   => 'ذهاب فقط',
                'afternoon' => 'عودة فقط',
                'full_day'  => 'يوم كامل',
            ][$request->type] ?? 'يوم كامل';

            foreach ($staffUserIds as $userId) {
                $this->notificationService->sendToUser(
                    userId: $userId,
                    type: 'student_absence',
                    title: "تنبيه غياب ($typeName): {$student->full_name}",
                    message: "أفاد ولي الأمر بغياب الطالب ($typeName) يوم ({$request->date}). يرجى عدم المرور بالمنزل.",
                    data: [
                        'student_id'   => (string) $student->id,
                        'student_name' => $student->full_name,
                        'absence_type' => $request->type,
                        'date'         => $request->date,
                    ],
                    immediate: true
                );
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('[Absence Notification] Detail Error: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إرسال طلب الغياب بنجاح، وتم إبلاغ السائق فورياً.',
            'data'    => $absenceRequest,
        ], 201);
    }

    /**
     * GET /api/parent/absence-requests
     * عرض سجل طلبات الغياب
     */
    public function absenceRequestsHistory(Request $request): JsonResponse
    {
        $user = $request->user();

        $requests = \App\Models\AbsenceRequest::where('guardian_id', $user->id)
            ->with('student')
            ->orderByDesc('date')
            ->get();

        $data = $requests->map(function ($r) {
            return [
                'id' => (string) $r->id,
                'student_id' => (string) $r->student_id,
                'student_name' => $r->student?->full_name,
                'date' => $r->date->format('Y-m-d'),
                'type' => $r->type,
                'reason' => $r->reason,
                'status' => $r->status,
                'rejection_reason' => $r->rejection_reason,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }
}


