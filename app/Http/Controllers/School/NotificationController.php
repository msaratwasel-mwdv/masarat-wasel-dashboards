<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\NotificationTemplate;
use App\Models\Classroom;
use App\Models\Bus;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\NotificationService;
use App\Models\Incident;
use App\Models\Student;

class NotificationController extends Controller
{
    /**
     * Display a listing of notifications sent by this school.
     */
    public function index(Request $request)
    {
        $schoolId = Auth::user()->school_id;
        $userId = Auth::id();

        // Get notification IDs received via notification_recipients table
        $receivedNotificationIds = \App\Models\NotificationRecipient::where('user_id', $userId)
            ->pluck('notification_id');

        $query = Notification::where(function ($q) use ($userId, $receivedNotificationIds) {
                $q->where('sender_id', $userId)
                  ->orWhereIn('id', $receivedNotificationIds);
            })
            ->with('sender')
            ->latest();

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where(function ($q) use ($request) {
                $q->where('template_type', $request->type)
                  ->orWhere('type', $request->type);
            });
        }

        $notifications = $query->paginate(20);

        // Load incident details for received/incident notifications
        $notifications->getCollection()->transform(function ($notif) {
            $incidentId = $notif->data['incident_id'] ?? null;
            if ($notif->type === 'incident' && $incidentId) {
                $incident = \App\Models\Incident::with([
                    'bus.driver',
                    'bus.fieldSupervisor',
                    'bus',
                    'reporter' // This might need to be resolved if relationship is missing
                ])->find($incidentId);

                if ($incident && !empty($incident->student_ids)) {
                    $incident->students_list = \App\Models\Student::whereIn('id', $incident->student_ids)
                        ->get()
                        ->map(function($s) {
                            return [
                                'id' => $s->id,
                                'name' => $s->full_name,
                                'student_code' => $s->student_code ?? null,
                            ];
                        });
                }

                $notif->incident = $incident;
            }
            return $notif;
        });

        // Stats (include both sent and received)
        $totalQuery = Notification::where(function ($q) use ($userId, $receivedNotificationIds) {
            $q->where('sender_id', $userId)->orWhereIn('id', $receivedNotificationIds);
        });

        $stats = [
            'total' => (clone $totalQuery)->count(),
            'sent_today' => (clone $totalQuery)->whereDate('created_at', today())->count(),
            'pending' => (clone $totalQuery)->whereIn('status', ['pending', 'sent'])->count(),
        ];

        // Data for Modal
        $templates = NotificationTemplate::active()->get();
        $classrooms = Classroom::atSchool($schoolId)->get();
        $buses = Bus::where('school_id', $schoolId)->get();

        // Parents — باستخدام الـ Scopes للتعامل مع الهيكلية الجديدة
        $parents = User::atSchool($schoolId)
            ->withRole('parent')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email ?? '',
                ];
            });

        return Inertia::render('School/Notifications/Index', [
            'notifications' => $notifications,
            'stats' => $stats,
            'templates' => $templates,
            'classrooms' => $classrooms,
            'buses' => $buses,
            'parents' => $parents,
            'filters' => $request->only(['status', 'type']),
        ]);
    }

    /**
     * Show the form for creating a new notification.
     */

    /**
     * Display sent notifications only.
     */
    public function sent(Request $request)
    {
        $schoolId = Auth::user()->school_id;
        $userId = Auth::id();

        $query = Notification::where('sender_id', $userId)
            ->with('sender')
            ->latest();

        if ($request->filled('type')) {
            $query->where(function ($q) use ($request) {
                $q->where('template_type', $request->type)
                  ->orWhere('type', $request->type);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $notifications = $query->paginate(20);

        $sentBase = Notification::where('sender_id', $userId);
        $stats = [
            'total' => (clone $sentBase)->count(),
            'sent_today' => (clone $sentBase)->whereDate('created_at', today())->count(),
            'pending' => (clone $sentBase)->whereIn('status', ['pending', 'sent'])->count(),
        ];

        $templates = NotificationTemplate::active()->get();
        $classrooms = Classroom::atSchool($schoolId)->get();
        $buses = Bus::where('school_id', $schoolId)->get();
        $parents = User::atSchool($schoolId)
            ->withRole('parent')
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email ?? '',
            ]);

        return Inertia::render('School/Notifications/Sent', [
            'notifications' => $notifications,
            'stats' => $stats,
            'templates' => $templates,
            'classrooms' => $classrooms,
            'buses' => $buses,
            'parents' => $parents,
            'filters' => $request->only(['status', 'type']),
        ]);
    }

    /**
     * Display received notifications (incidents & reports) only.
     */
    public function received(Request $request)
    {
        $userId = Auth::id();

        $receivedNotificationIds = \App\Models\NotificationRecipient::where('user_id', $userId)
            ->pluck('notification_id');

        $query = Notification::where(function ($q) use ($userId, $receivedNotificationIds) {
                $q->where('user_id', $userId)
                  ->orWhereIn('id', $receivedNotificationIds);
            })
            ->with('sender')
            ->latest();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $notifications = $query->paginate(20);

        // Enrich with incident details
        $notifications->getCollection()->transform(function ($notif) {
            $incidentId = $notif->data['incident_id'] ?? null;
            if ($notif->type === 'incident' && $incidentId) {
                $incident = \App\Models\Incident::with([
                    'bus.driver',
                    'bus.fieldSupervisor',
                    'bus',
                    'reporter'
                ])->find($incidentId);

                if ($incident && !empty($incident->student_ids)) {
                    $incident->students_list = \App\Models\Student::whereIn('id', $incident->student_ids)
                        ->get()
                        ->map(fn($s) => [
                            'id' => $s->id,
                            'name' => $s->full_name,
                            'student_code' => $s->student_code ?? null,
                        ]);
                }

                $notif->incident = $incident;
            }
            return $notif;
        });

        $receivedBase = Notification::where(function ($q) use ($userId, $receivedNotificationIds) {
            $q->where('user_id', $userId)
              ->orWhereIn('id', $receivedNotificationIds);
        });
        $stats = [
            'total' => (clone $receivedBase)->count(),
            'unread' => (clone $receivedBase)->where('status', 'unread')->count(),
            'incidents' => (clone $receivedBase)->where('type', 'incident')->count(),
        ];

        return Inertia::render('School/Notifications/Received', [
            'notifications' => $notifications,
            'stats' => $stats,
            'filters' => $request->only(['type']),
        ]);
    }

    /**
     * Show the form for creating a new notification.
     */
    public function create()
    {
        $schoolId = Auth::user()->school_id;

        $templates = NotificationTemplate::active()->get();
        $classrooms = Classroom::atSchool($schoolId)->get();
        $buses = Bus::where('school_id', $schoolId)->get();
        // تم إضافة guardians هنا لأن الواجهة Create.tsx تتوقعها في الـ Props
        $guardians = User::atSchool($schoolId)->withRole('parent')->get();

        return Inertia::render('School/Notifications/Create', [
            'templates' => $templates,
            'classrooms' => $classrooms,
            'buses' => $buses,
            'guardians' => $guardians,
        ]);
    }

    public function preview(Request $request)
    {
        $schoolId = Auth::user()->school_id;

        $recipientType = $request->recipient_type;
        $filter = $request->recipient_filter ?? [];

        $recipients = $this->getRecipients($schoolId, $recipientType, $filter);

        return response()->json([
            'count' => $recipients->count(),
            'total_recipients' => $recipients->count(),
            'title' => $request->title,
            'message' => $request->message,
            'recipients' => $recipients->take(5)->map(function ($user) {
                return [
                    'name' => $user->name,
                    'has_fcm_token' => !empty($user->fcm_token),
                ];
            }),
        ]);
    }


    /**
     * Store a newly created notification.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'message' => 'required|string',
            'message_en' => 'nullable|string',
            'type' => 'required|string',
            'recipient_type' => 'required|string',
            'recipient_filter' => 'nullable|array',
            'template_id' => 'nullable|exists:notification_templates,id',
        ]);

        $schoolId = Auth::user()->school_id;
        $recipients = $this->getRecipients($schoolId, $validated['recipient_type'], $validated['recipient_filter'] ?? []);

        // Idempotency check: prevent duplicate submissions within 10 seconds
        $recentDuplicate = Notification::where('sender_id', Auth::id())
            ->where('title', $validated['title'])
            ->where('message', $validated['message'])
            ->where('created_at', '>=', now()->subSeconds(10))
            ->first();

        if ($recentDuplicate) {
            return redirect()->back()->with('error', 'تم إرسال هذا الإشعار مسبقاً.');
        }

        DB::beginTransaction();
        try {
            $correlationId = \Illuminate\Support\Str::uuid()->toString();

            // Detect and replace placeholders like {bus_number}
            $finalTitle = $validated['title'];
            $finalMessage = $validated['message'];
            $finalTitleEn = $validated['title_en'] ?? '';
            $finalMessageEn = $validated['message_en'] ?? '';

            if (str_contains($finalMessage, '{bus_number}') || str_contains($finalTitle, '{bus_number}')) {
                $busNumber = '';
                if (!empty($validated['recipient_filter']['bus_ids'])) {
                    $bus = \App\Models\Bus::find($validated['recipient_filter']['bus_ids'][0]);
                    if ($bus) {
                        $busNumber = $bus->bus_number;
                    }
                }

                $finalTitle = str_replace('{bus_number}', $busNumber, $finalTitle);
                $finalMessage = str_replace('{bus_number}', $busNumber, $finalMessage);
                $finalTitleEn = str_replace('{bus_number}', $busNumber, $finalTitleEn);
                $finalMessageEn = str_replace('{bus_number}', $busNumber, $finalMessageEn);
            }


            // Create the notification
            $notification = Notification::create([
                'title' => $finalTitle,
                'title_en' => $finalTitleEn,
                'message' => $finalMessage,
                'message_en' => $finalMessageEn,
                'type' => $validated['type'],
                'template_type' => $validated['type'],
                'sender_id' => Auth::id(),
                'recipient_type' => $validated['recipient_type'],
                'recipient_filter' => $validated['recipient_filter'],
                'total_recipients' => $recipients->count(),
                'status' => 'pending',
                'data' => [
                    'template_id' => $validated['template_id'] ?? null,
                    'correlation_id' => $correlationId,
                ]
            ]);

            $tokensAr = [];
            $tokensEn = [];
            $allTokenCount = 0;

            // Create recipient records AND group tokens by language
            foreach ($recipients as $parentUser) {
                // 1. Create exactly ONE recipient record per user for tracking read status
                $notification->recipients()->create([
                    'user_id' => $parentUser->id,
                    'status' => 'pending',
                    // No token here, we track per user
                ]);

                // 2. Collect all tokens for sending
                $tokenRecords = $parentUser->fcmTokens()
                    ->select(['token', 'preferred_language'])
                    ->get();

                foreach ($tokenRecords as $record) {
                    if ($record->preferred_language === 'en') {
                        $tokensEn[] = $record->token;
                    } else {
                        $tokensAr[] = $record->token;
                    }
                    $allTokenCount++;
                }
            }

            DB::commit();

            $titleEn = $validated['title_en'] ?? '';
            $messageEn = $validated['message_en'] ?? '';

            // إرسال الإشعار فعلياً عبر Firebase — مفصول حسب اللغة
            if ($allTokenCount > 0) {
                \Illuminate\Support\Facades\Log::info("[NotificationController] Sending: AR=" . count($tokensAr) . ", EN=" . count($tokensEn));
                try {
                    $notificationService = app(\App\Services\NotificationService::class);

                    $basePayload = [
                        'notification_id' => (string) $notification->id,
                        'type' => 'admin_announcement',
                        'original_type' => $validated['type'],
                        'title_en' => $finalTitleEn,
                        'message_en' => $finalMessageEn,
                        'correlation_id' => $correlationId,
                        'deep_link' => '/notifications/' . $notification->id,
                        'click_action' => 'FLUTTER_NOTIFICATION_CLICK'
                    ];

                    // إرسال النسخة العربية للأجهزة العربية
                    if (!empty($tokensAr)) {
                        $notificationService->sendMulticast(
                            $tokensAr,
                            $finalTitle,
                            $finalMessage,
                            array_merge($basePayload, ['language' => 'ar'])
                        );
                    }

                    // إرسال النسخة الإنجليزية للأجهزة الإنجليزية
                    if (!empty($tokensEn)) {
                        $notificationService->sendMulticast(
                            $tokensEn,
                            $finalTitleEn,
                            $finalMessageEn,
                            array_merge($basePayload, ['language' => 'en'])
                        );
                    }

                    $notification->update(['status' => 'sent', 'sent_count' => $allTokenCount]);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error('Firebase Notification Error: ' . $e->getMessage());
                    $notification->update(['status' => 'failed', 'failed_count' => $allTokenCount, 'sent_count' => 0]);
                    return redirect()->route('school.notifications.index')
                        ->with('success', 'تم حفظ الإشعار في النظام، ولكن تعذر الإرسال للهواتف (لم يتم إعداد Firebase بعد).');
                }
            } else {
                $notification->update(['status' => 'sent', 'sent_count' => 0]);
            }

            // 4. بث الحدث لحظياً عبر Websockets (Reverb) لكل مستخدم
            foreach ($recipients as $recipient) {
                event(new \App\Events\NotificationPushed($notification, $recipient->id, $correlationId));
            }

            return redirect()->back()
                ->with('success', 'تم حفظ الإشعار بنجاح لـ ' . $allTokenCount . ' مستخدم');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'حدث خطأ أثناء إنشاء الإشعار: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified notification.
     */
    public function show(Notification $notification)
    {
        // Authorization
        if ($notification->sender_id !== Auth::id()) {
            abort(403);
        }

        $notification->load(['sender', 'recipients.user']);

        return Inertia::render('School/Notifications/Show', [
            'notification' => $notification,
        ]);
    }

    /**
     * Helper: Get recipients based on type and filter.
     * الآن يرجع مجموعة من User (role=parent) بدلاً من Guardian
     */
    private function getRecipients($schoolId, $recipientType, $filter)
    {
        switch ($recipientType) {
            case 'all_parents':
                return User::atSchool($schoolId)->withRole('parent')->get();

            case 'by_classroom': // تم تحديث المسمى ليطابق Create.tsx
            case 'class_students':
                $classroomIds = $filter['classroom_ids'] ?? [];
                // أولياء الأمور الذين لديهم طلاب في هذه الفصول
                return User::atSchool($schoolId)
                    ->withRole('parent')
                    ->whereHas('students', function ($q) use ($classroomIds) {
                        $q->whereHas('currentEnrollment', function ($eq) use ($classroomIds) {
                            $eq->whereIn('classroom_id', $classroomIds);
                        });
                    })->get();

            case 'by_bus': // تم تحديث المسمى ليطابق Create.tsx
            case 'bus_students':
                $busIds = $filter['bus_ids'] ?? [];
                return User::atSchool($schoolId)
                    ->withRole('parent')
                    ->whereHas('students.buses', function ($q) use ($busIds) {
                        $q->whereIn('buses.id', $busIds);
                    })->get();

            case 'specific_parent': // تم تحديث المسمى ليطابق Create.tsx
            case 'specific_guardian':
                $guardianId = $filter['guardian_id'] ?? null;
                return User::where('id', $guardianId)->withRole('parent')->get();

            default:
                return collect();
        }
    }

    /**
     * Resend incident/behavioral report to guardian.
     */
    public function resendIncidentToParent(Incident $incident, NotificationService $notificationService)
    {
        $schoolId = Auth::user()->school_id;
        $incident->load('bus');

        if ($incident->bus && $incident->bus->school_id !== $schoolId) {
            abort(403, 'Unauthorized action.');
        }

        if (empty($incident->student_ids) || !is_array($incident->student_ids)) {
            return redirect()->back()->with('error', 'لا يوجد طلاب مرتبطين بهذا البلاغ.');
        }

        $sentCount = 0;
        foreach ($incident->student_ids as $studentId) {
            $student = Student::with('guardians')->find($studentId);
            if (!$student) {
                continue;
            }

            // Check student belongs to the school
            if ($student->school_id !== $schoolId) {
                continue;
            }

            foreach ($student->guardians as $guardian) {
                $notificationService->sendToUser(
                    userId: $guardian->id,
                    type: 'schoolAlert',
                    title: 'تنبيه سلوكي - ' . $student->full_name,
                    message: 'تنبيه سلوكي من المدرسة بخصوص الطالب: ' . $incident->description,
                    data: [
                        'incident_id' => (string) $incident->id,
                        'student_id' => (string) $student->id,
                        'category' => 'incidents',
                        'target_screen' => 'incident_details',
                    ],
                    titleEn: 'Behavioral Alert - ' . ($student->full_name_en ?: $student->full_name),
                    messageEn: 'School behavioral report regarding student: ' . $incident->description,
                    fromUserName: 'إدارة المدرسة',
                    fromUserNameEn: 'School Administration'
                );
                $sentCount++;
            }
        }

        if ($sentCount === 0) {
            return redirect()->back()->with('error', 'لم يتم العثور على أولياء أمور مسجلين لهؤلاء الطلاب.');
        }

        return redirect()->back()->with('success', 'تم إعادة إرسال البلاغ بنجاح إلى أولياء الأمور (' . $sentCount . ').');
    }
}
