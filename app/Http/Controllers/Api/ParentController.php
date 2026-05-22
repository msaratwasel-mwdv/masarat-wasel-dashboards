<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentLocationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

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
                'todayTripAttendances.trip',
                'forthBus.route', 
                'backBus.route',
                'forthBus.driver.user',
                'backBus.driver.user',
                'forthBus.assistant',
                'backBus.assistant',
                'lastTripAttendance',
                'currentEnrollment.classroom.school',
                'currentEnrollment.classroom.grade',
                'locationRequests' => fn($q) => $q->where('status', 'pending')->latest()
            ])
            ->get();

        $data = $students->map(function (Student $student) use ($user) {
            // بيانات الباص الصباحي والمسائي
            $morningBus = $student->forthBus;
            $eveningBus = $student->backBus ?? $morningBus;

            // تحديد الباص النشط بناءً على حالة الرحلة
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

            // تحديد سجل الحضور اليومي النشط والمناسب للطالب بناءً على أولويات الرحلة والحالة
            $lastLog = null;
            if ($student->todayTripAttendances->isNotEmpty()) {
                // 1. إذا كانت هناك رحلة قيد التشغيل حالياً (in_progress)، نعتمد سجل الحضور الخاص بها كأولوية قصوى.
                $lastLog = $student->todayTripAttendances->first(function ($att) {
                    return $att->trip && $att->trip->status === 'in_progress';
                });

                // 2. إذا لم توجد رحلة نشطة، نأخذ السجل الأخير الذي تغيرت فيه حالة الطالب بالفعل (أي ليست غائب وليست معذور)
                if (!$lastLog) {
                    $lastLog = $student->todayTripAttendances
                        ->filter(function ($att) {
                            return $att->status && !in_array($att->status, ['absent', 'excused']);
                        })
                        ->sortByDesc('id')
                        ->first();
                }

                // 3. إذا لم يوجد، نأخذ آخر رحلة منتهية (finished أو completed أو awaiting_video)
                if (!$lastLog) {
                    $lastLog = $student->todayTripAttendances
                        ->filter(function ($att) {
                            return $att->trip && in_array($att->trip->status, ['finished', 'completed', 'awaiting_video']);
                        })
                        ->sortByDesc('id')
                        ->first();
                }

                // 4. كخيار أخير، نعتمد الرحلة الأولى لليوم
                if (!$lastLog) {
                    $lastLog = $student->todayTripAttendances->sortBy('id')->first();
                }
            }

            $studentStatus = 'atHome';
            if ($lastLog) {
                if ($lastLog->status === 'boarded' || $lastLog->status === 'present') {
                    $studentStatus = 'onBus';
                } elseif ($lastLog->status === 'alighted' || $lastLog->status === 'dropped_off' || $lastLog->status === 'dropped') {
                    $tripType = $lastLog->trip?->type ?? 'morning';
                    $studentStatus = ($tripType === 'morning' || $tripType === 'forth') ? 'atSchool' : 'atHome';
                } elseif ($lastLog->status === 'waiting') {
                    $studentStatus = 'waiting';
                } elseif ($lastLog->status === 'absent') {
                    $studentStatus = 'atHome';
                }
            }

            // جلب طلب تحديد الموقع المعلق إن وجد
            $pendingReq = $student->locationRequests->first();

            // اقتراح اتجاه الرحلة بناءً على حالة الباص
            $suggestedDirection = ($activeBus && in_array($activeBus->trip_status, ['to_home'])) ? 'to_home' : 'to_school';

            // حساب الأوقات المرحلية الخمسة من سجلات اليوم بناءً على الرحلات
            $waitingAtHomeTime = null;
            $onBusToSchoolTime = null;
            $atSchoolTime = null;
            $onBusToHomeTime = null;
            $arrivedHomeTime = null;

            foreach ($student->todayTripAttendances as $att) {
                $tripType = $att->trip?->type ?? 'forth';
                $isMorning = in_array($tripType, ['forth', 'morning']);

                if ($isMorning) {
                    if ($att->waiting_start_time) {
                        $waitingAtHomeTime = $att->waiting_start_time->toIso8601String();
                    } elseif ($att->status === 'waiting') {
                        $waitingAtHomeTime = $att->updated_at->toIso8601String();
                    }

                    if ($att->check_in_time) {
                        $onBusToSchoolTime = $att->check_in_time->toIso8601String();
                    } elseif (in_array($att->status, ['boarded', 'present'])) {
                        $onBusToSchoolTime = $att->updated_at->toIso8601String();
                    }

                    if ($att->check_out_time) {
                        $atSchoolTime = $att->check_out_time->toIso8601String();
                    } elseif (in_array($att->status, ['dropped', 'alighted', 'dropped_off'])) {
                        $atSchoolTime = $att->updated_at->toIso8601String();
                    }
                } else {
                    if ($att->check_in_time) {
                        $onBusToHomeTime = $att->check_in_time->toIso8601String();
                    } elseif (in_array($att->status, ['boarded', 'present'])) {
                        $onBusToHomeTime = $att->updated_at->toIso8601String();
                    }

                    if ($att->check_out_time) {
                        $arrivedHomeTime = $att->check_out_time->toIso8601String();
                    } elseif (in_array($att->status, ['dropped', 'alighted', 'dropped_off'])) {
                        $arrivedHomeTime = $att->updated_at->toIso8601String();
                    }
                }
            }

            return [
                'id'           => $student->id,
                'name'         => $student->full_name,
                'name_en'      => $student->full_name_en,
                'national_id'  => $student->national_id,
                'gender'       => $student->gender,
                'student_code' => $student->student_code,
                'status'       => $studentStatus,
                'suggested_direction' => $suggestedDirection,
                'waiting_at_home_time' => $waitingAtHomeTime,
                'on_bus_to_school_time' => $onBusToSchoolTime,
                'at_school_time' => $atSchoolTime,
                'on_bus_to_home_time' => $onBusToHomeTime,
                'arrived_home_time' => $arrivedHomeTime,
                'grade'                  => (function() use ($student) {
                    $classroom = $student->currentEnrollment?->classroom;
                    $gradeNameAr = $classroom?->grade ? ($classroom->grade->getAttributes()['name'] ?? null) : null;
                    $classroomNameAr = $classroom ? ($classroom->getAttributes()['name'] ?? null) : null;
                    if ($gradeNameAr && $classroomNameAr) {
                        return "{$gradeNameAr} - {$classroomNameAr}";
                    }
                    return $gradeNameAr ?? $classroomNameAr ?? 'غير محدد';
                })(),
                'grade_en'               => (function() use ($student) {
                    $classroom = $student->currentEnrollment?->classroom;
                    if (!$classroom) return 'Not specified';

                    $gradeRaw = trim($classroom->grade ? ($classroom->grade->getAttributes()['name'] ?? '') : '');
                    $gradeMap = [
                        'الصف الأول'  => 'First Grade',
                        'الصف الثاني' => 'Second Grade',
                        'الصف الثالث' => 'Third Grade',
                        'أول ثانوي'   => 'First Secondary',
                        'ثاني ثانوي'  => 'Second Secondary',
                        'ثالث ثانوي'  => 'Third Secondary',
                        'الروضة'      => 'Kindergarten',
                        'الابتدائي'   => 'Primary',
                        'المتوسط'     => 'Intermediate',
                        'غير محدد'    => 'Undetermined',
                    ];
                    $gradeEn = $gradeMap[$gradeRaw] ?? $gradeRaw;

                    $classroomEn = !empty(trim($classroom->getAttributes()['name_en'] ?? ''))
                        ? $classroom->getAttributes()['name_en']
                        : ($classroom->getAttributes()['name'] ?? '');

                    if ($gradeEn && $classroomEn) {
                        return "{$gradeEn} - {$classroomEn}";
                    }
                    return $gradeEn ?: $classroomEn ?: 'Not specified';
                })(),
                'trip_count'             => $student->trips_count ?? 0,
                'attendance_percentage'  => $attendancePercentage,
                'image_url'              => $imageUrl,
                'home_lat'               => $student->latitude ?? $user->latitude,
                'home_lng'               => $student->longitude ?? $user->longitude,
                'home_address'           => $student->address ?? $user->address,
                'location_note'          => $student->location_note,
                'pending_location' => $pendingReq ? [
                    'latitude' => $pendingReq->new_latitude,
                    'longitude' => $pendingReq->new_longitude,
                    'address' => $pendingReq->new_address,
                    'created_at' => $pendingReq->created_at->toIso8601String(),
                ] : null,
                'school'      => $student->currentEnrollment?->classroom?->school ? [
                    'id'      => $student->currentEnrollment->classroom->school->id,
                    'name'    => $student->currentEnrollment->classroom->school->name,
                    'address' => $student->currentEnrollment->classroom->school->address,
                    'latitude' => $student->currentEnrollment->classroom->school->latitude,
                    'longitude' => $student->currentEnrollment->classroom->school->longitude,
                    'location' => $student->currentEnrollment->classroom->school->address, // Keep for backward compatibility
                ] : null,
                'bus' => $activeBus ? [
                    'id'           => $activeBus->id,
                    'bus_number'   => $activeBus->bus_number,
                    'plate_number' => $activeBus->plate_number,
                    'trip_status'  => $activeBus->trip_status,
                    'total_students' => $activeBus->students_count,
                    'latitude'     => $activeBus->latitude,
                    'longitude'    => $activeBus->longitude,
                    'departure_time' => $activeBus->activeTrip?->departure_time?->toIso8601String(),
                    'speed_kmh'      => cache()->get('bus_speed_'.$activeBus->id, 0),
                    'eta_minutes'    => cache()->get('bus_eta_'.$activeBus->id),
                    'driver' => $activeBus->driver && $activeBus->driver->user ? [
                        'id'    => $activeBus->driver->user->id,
                        'name'  => $activeBus->driver->user->name,
                        'phone' => $activeBus->driver->user->phone,
                        'image_url' => $activeBus->driver->user->avatar_url,
                    ] : null,
                    'supervisor' => $activeBus->assistant ? [
                        'id'    => $activeBus->assistant->id,
                        'name'  => $activeBus->assistant->name,
                        'phone' => $activeBus->assistant->phone,
                        'image_url' => $activeBus->assistant->avatar_url,
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
            $student->load(['currentEnrollment.classroom.school', 'forthBus.driver', 'forthBus.assistant', 'backBus.driver', 'backBus.assistant']);
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

            $typeKeys = [
                'morning'   => 'ذهاب فقط',
                'afternoon' => 'عودة فقط',
                'full_day'  => 'يوم كامل',
            ];
            $typeName = $typeKeys[$request->type] ?? 'يوم كامل';

            $typeKeysEn = [
                'morning'   => 'Morning only',
                'afternoon' => 'Afternoon only',
                'full_day'  => 'Full day',
            ];
            $typeNameEn = $typeKeysEn[$request->type] ?? 'Full day';

            foreach ($staffUserIds as $userId) {
                $this->notificationService->sendTranslatedToUser(
                    userId: $userId,
                    type: 'student_absence',
                    titleKey: 'notifications.absence_alert_title',
                    messageKey: 'notifications.absence_alert_message',
                    translationParams: [
                        'type' => $typeName,
                        'student' => $student->full_name,
                        'date' => $absenceRequest->date->format('Y-m-d'),
                    ],
                    data: [
                        'type'         => 'student_absence',
                        'student_id'   => (string) $student->id,
                        'student_name' => $student->full_name,
                        'absence_type' => $request->type,
                        'date'         => $absenceRequest->date->format('Y-m-d'),
                        'category'     => 'absence',
                        'target_screen' => 'absence_history',
                    ],
                    translationParamsEn: [
                        'type' => $typeNameEn,
                        'student' => $student->full_name_en ?: $student->full_name,
                        'date' => $absenceRequest->date->format('Y-m-d'),
                    ]
                );
            }
        } catch (\Exception $e) {
            Log::error('[Absence Notification] Detail Error: ' . $e->getMessage());
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

    /**
     * GET /api/parent/location-requests
     * عرض سجل طلبات تغيير الموقع
     */
    public function locationRequestsHistory(Request $request): JsonResponse
    {
        $user = $request->user();

        $requests = \App\Models\StudentLocationRequest::where('guardian_id', $user->id)
            ->with('student')
            ->orderByDesc('created_at')
            ->get();

        $data = $requests->map(function ($r) {
            return [
                'id' => (string) $r->id,
                'student_id' => (string) $r->student_id,
                'student_name' => $r->student?->full_name,
                'created_at' => $r->created_at->toIso8601String(),
                'status' => $r->status,
                'new_latitude' => $r->new_latitude,
                'new_longitude' => $r->new_longitude,
                'new_address' => $r->new_address,
                'note' => $r->note,
                'rejection_reason' => $r->rejection_reason,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    /**
     * POST /api/parent/location/update
     * تحديث الإحداثيات الجغرافية للمنزل
     */
    public function updateLocation(Request $request): JsonResponse
    {
        $request->validate([
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $user = $request->user();
        Log::info("📍 Location Update: User ID {$user->id} set location to Lat: {$request->latitude}, Lng: {$request->longitude}");
        
        $user->update([
            'latitude'  => $request->latitude,
            'longitude' => $request->longitude,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث موقع المنزل بنجاح.',
        ]);
    }

    /**
     * POST /api/parent/student/location/update
     * تحديث الإحداثيات الجغرافية لمنزل طالب محدد
     */
    public function updateStudentLocation(Request $request): JsonResponse
    {
        Log::debug("🚀 updateStudentLocation API hit", ['data' => $request->all()]);
        
        $user = $request->user();
        $studentId = $request->student_id;
        
        // 🔒 Race condition guard: Prevent processing multiple requests for the same student within 5 seconds
        $cacheKey = "location_update_lock_{$user->id}_{$studentId}";
        if (\Illuminate\Support\Facades\Cache::has($cacheKey)) {
            return response()->json([
                'success' => true,
                'message' => 'يتم معالجة الطلب بالفعل.',
            ]);
        }
        \Illuminate\Support\Facades\Cache::put($cacheKey, true, 5);

        $request->validate([
            'student_id' => 'required|exists:students,id',
            'latitude'   => 'required|numeric|between:-90,90',
            'longitude'  => 'required|numeric|between:-180,180',
            'address'    => 'nullable|string|max:500',
            'note'       => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        
        // التحقق من أن الطالب يتبع لولي الأمر مع تحميل بيانات المدرسة
        $student = $user->students()
            ->where('students.id', $request->student_id)
            ->with(['currentEnrollment.classroom.grade', 'forthBus', 'backBus'])
            ->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'الطالب غير موجود أو لا يتبع لك.',
            ], 404);
        }

        // --- منع تكرار الطلبات المعلقة ---
        $pendingRequest = \App\Models\StudentLocationRequest::where('student_id', $student->id)
            ->where('status', 'pending')
            ->first();

        if ($pendingRequest) {
            return response()->json([
                'success' => false,
                'message' => 'يوجد طلب تحديد/تغيير موقع معلق بالفعل لهذا الطالب لدى إدارة المدرسة. يرجى الانتظار حتى تتم معالجته.',
            ], 422);
        }

        // ── التحقق: هل هذا إعداد أولي (أول مرة يحدد الموقع) أم تغيير لموقع قائم؟ ──
        // الإعداد الأولي = الطالب ليس لديه إحداثيات سابقة فعلية ولا ولي الأمر لديه إحداثيات
        $hasValidCoordinates = ($student->latitude && floatval($student->latitude) != 0)
            || ($user->latitude && floatval($user->latitude) != 0);

        $isInitialSetup = !$hasValidCoordinates;
        
        if ($isInitialSetup) {
            Log::info("🆕 Initial Location Setup: Direct update for student ID {$student->id}");
            
            \Illuminate\Support\Facades\DB::transaction(function () use ($student, $request) {
                // 1. Update student coordinates directly (أول مرة - بدون موافقة)
                $student->update([
                    'latitude'  => $request->latitude,
                    'longitude' => $request->longitude,
                    'address'   => $request->address,
                    'location_note' => $request->note,
                ]);

                // 2. Clear any existing pending requests for this student to keep data clean
                \App\Models\StudentLocationRequest::where('student_id', $student->id)
                    ->where('status', 'pending')
                    ->update([
                        'status' => 'rejected',
                        'rejection_reason' => 'تم تحديد الموقع بنجاح من خلال الإعداد الأولي.'
                    ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'تم تحديد موقع المنزل لأول مرة بنجاح.',
            ]);
        }


        // تحديد معرف المدرسة بشكل أكثر دقة مع بدائل (Fallbacks)
        $schoolId = $student->school_id;
        if ($schoolId) {
            Log::info("✅ Found school_id from student accessor: $schoolId");
        }
        
        // 1. Try Enrollment chain (Preferred)
        if (!$schoolId) {
            $schoolId = $student->currentEnrollment?->classroom?->grade?->school_id;
            if ($schoolId) Log::info("✅ Found school_id from enrollment chain: $schoolId");
        }
        
        // 2. Try Bus associations (Fallback)
        if (!$schoolId) {
            $schoolId = $student->forthBus?->school_id ?? $student->backBus?->school_id;
            if ($schoolId) Log::info("✅ Found school_id from bus association: $schoolId");
        }

        if (!$schoolId) {
            Log::warning("⚠️ Could not determine school_id for student ID {$student->id} in location request.");
        }

        Log::info("📍 Student Location Change Request: Guardian ID {$user->id} for Student ID {$student->id} (School: {$schoolId}) to Lat: {$request->latitude}, Lng: {$request->longitude}");
        
        // إنشاء طلب تغيير الموقع مع منطق "البحث الذكي" عن الموقع القديم (Fallback)
        $oldLat = ($student->latitude && $student->latitude != 0) ? $student->latitude : $user->latitude;
        $oldLng = ($student->longitude && $student->longitude != 0) ? $student->longitude : $user->longitude;
        $oldAddr = $student->address ?: $user->address;

        try {
            $locationRequest = \App\Models\StudentLocationRequest::create([
                'student_id'   => $student->id,
                'guardian_id'  => $user->id,
                'school_id'    => $schoolId,
                'old_latitude' => $oldLat,
                'old_longitude'=> $oldLng,
                'old_address'  => $oldAddr,
                'new_latitude' => $request->latitude,
                'new_longitude'=> $request->longitude,
                'new_address'  => $request->address,
                'note'         => $request->note,
                'status'       => 'pending',
            ]);
            Log::info("✅ StudentLocationRequest created successfully: ID {$locationRequest->id}");
        } catch (\Exception $e) {
            Log::error("❌ Failed to create StudentLocationRequest: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء حفظ الطلب.',
            ], 500);
        }

        // إخطار مديري المدرسة بالطلب الجديد
        try {
            if ($schoolId) {
                $notificationService = app(\App\Services\NotificationService::class);
                $adminIds = \App\Models\User::atSchool($schoolId)
                    ->whereHas('roles', fn($q) => $q->where('name', 'school_admin'))
                    ->where('id', '!=', $user->id)
                    ->pluck('id');
                    
                Log::info("🔔 Notifying " . count($adminIds) . " school admins for location request ID {$locationRequest->id}");

                foreach ($adminIds as $adminId) {
                    $notificationService->sendTranslatedToUser(
                        userId: $adminId,
                        type: 'location_request',
                        titleKey: 'notifications.location_request_title',
                        messageKey: 'notifications.location_request_message',
                        translationParams: [
                            'guardian' => $user->name,
                            'student' => $student->full_name,
                        ],
                        data: [
                            'type' => 'location_request',
                            'location_request_id' => $locationRequest->id,
                            'student_id' => $student->id,
                            'category' => 'location_requests',
                            'target_screen' => 'location_request_details'
                        ],
                        fromUserName: $user->name,
                        translationParamsEn: [
                            'guardian' => $user->name_en ?: $user->name,
                            'student' => $student->full_name_en ?: $student->full_name,
                        ]
                    );
                }
            } else {
                Log::error("❌ Cannot notify admins: School ID is null for student {$student->id}");
            }
        } catch (\Exception $e) {
            Log::error("❌ Failed to notify admins about location request: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إرسال طلب تغيير الموقع للمدرسة للمراجعة والموافقة.',
        ]);
    }
}



