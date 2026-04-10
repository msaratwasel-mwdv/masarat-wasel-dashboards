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

class NotificationController extends Controller
{
    /**
     * Display a listing of notifications sent by this school.
     */
    public function index(Request $request)
    {
        $schoolId = Auth::user()->getSchoolId();

        $query = Notification::where('sender_id', Auth::id())
            ->with('sender')
            ->latest();

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('template_type', $request->type);
        }

        $notifications = $query->paginate(20);

        // Stats
        $stats = [
            'total' => Notification::where('sender_id', Auth::id())->count(),
            'sent_today' => Notification::where('sender_id', Auth::id())->whereDate('created_at', today())->count(),
            'pending' => Notification::where('sender_id', Auth::id())->where('status', 'pending')->count(),
        ];

        // Data for Modal
        $templates = NotificationTemplate::active()->get();
        $classrooms = Classroom::where('school_id', $schoolId)->get();
        $buses = Bus::where('school_id', $schoolId)->get();

        // Parents — الآن من جدول users مباشرة
        $parents = User::where('school_id', $schoolId)
            ->whereHas('roles', fn($q) => $q->where('name', 'parent'))
            ->get(['id', 'name', 'email'])
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
    public function create()
    {
        $schoolId = Auth::user()->getSchoolId();

        $templates = NotificationTemplate::active()->get();
        $classrooms = Classroom::where('school_id', $schoolId)->get();
        $buses = Bus::where('school_id', $schoolId)->get();
        // تم إضافة guardians هنا لأن الواجهة Create.tsx تتوقعها في الـ Props
        $guardians = User::where('school_id', $schoolId)->whereHas('roles', fn($q) => $q->where('name', 'parent'))->get();

        return Inertia::render('School/Notifications/Create', [
            'templates' => $templates,
            'classrooms' => $classrooms,
            'buses' => $buses,
            'guardians' => $guardians,
        ]);
    }

    public function preview(Request $request)
    {
        $schoolId = Auth::user()->getSchoolId();

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
            'message' => 'required|string',
            'type' => 'required|string', 
            'recipient_type' => 'required|string',
            'recipient_filter' => 'nullable|array',
            'template_id' => 'nullable|exists:notification_templates,id',
        ]);

        $schoolId = Auth::user()->getSchoolId();
        $recipients = $this->getRecipients($schoolId, $validated['recipient_type'], $validated['recipient_filter'] ?? []);

        DB::beginTransaction();
        try {
            // Create the notification
            $notification = Notification::create([
                'title' => $validated['title'],
                'message' => $validated['message'],
                'type' => $validated['type'],
                'template_type' => $validated['type'],
                'sender_id' => Auth::id(),
                'recipient_type' => $validated['recipient_type'],
                'recipient_filter' => $validated['recipient_filter'],
                'total_recipients' => $recipients->count(),
                'status' => 'pending',
                'data' => [
                    'template_id' => $validated['template_id'] ?? null,
                ]
            ]);

            $fcmTokens = [];

            // Create recipient records
            foreach ($recipients as $parentUser) {
                $token = $parentUser->fcm_token ?? null;

                $notification->recipients()->create([
                    'user_id' => $parentUser->id,
                    'fcm_token' => $token,
                    'status' => 'pending',
                ]);

                if ($token) {
                    $fcmTokens[] = $token;
                }
            }

            DB::commit();

            // إرسال الإشعار فعلياً عبر Firebase
            if (!empty($fcmTokens)) {
                try {
                    $notificationService = app(\App\Services\NotificationService::class);
                    $notificationService->sendMulticast(
                        $fcmTokens,
                        $validated['title'],
                        $validated['message'],
                        [
                            'notification_id' => (string) $notification->id,
                            'type' => $validated['type'],
                            'click_action' => 'FLUTTER_NOTIFICATION_CLICK'
                        ]
                    );
                    
                    $notification->update(['status' => 'sent', 'sent_count' => count($fcmTokens)]);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error('Firebase Notification Error: ' . $e->getMessage());
                    $notification->update(['status' => 'failed', 'failed_count' => count($fcmTokens), 'sent_count' => 0]);
                    return redirect()->route('school.notifications.index')
                        ->with('success', 'تم حفظ الإشعار في النظام، ولكن تعذر الإرسال للهواتف (لم يتم إعداد Firebase بعد).');
                }
            } else {
                $notification->update(['status' => 'sent', 'sent_count' => 0]);
            }

            return redirect()->route('school.notifications.index')
                ->with('success', 'تم حفظ الإشعار بنجاح لـ ' . count($fcmTokens) . ' مستخدم');
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
                return User::where('school_id', $schoolId)->whereHas('roles', fn($q) => $q->where('name', 'parent'))->get();

            case 'by_classroom': // تم تحديث المسمى ليطابق Create.tsx
            case 'class_students':
                $classroomIds = $filter['classroom_ids'] ?? [];
                // أولياء الأمور الذين لديهم طلاب في هذه الفصول
                return User::where('school_id', $schoolId)
                    ->whereHas('roles', fn($q) => $q->where('name', 'parent'))
                    ->whereHas('students', function ($q) use ($classroomIds) {
                        $q->whereHas('currentEnrollment', function ($eq) use ($classroomIds) {
                            $eq->whereIn('classroom_id', $classroomIds);
                        });
                    })->get();

            case 'by_bus': // تم تحديث المسمى ليطابق Create.tsx
            case 'bus_students':
                $busIds = $filter['bus_ids'] ?? [];
                return User::where('school_id', $schoolId)
                    ->whereHas('roles', fn($q) => $q->where('name', 'parent'))
                    ->whereHas('students.buses', function ($q) use ($busIds) {
                        $q->whereIn('buses.id', $busIds);
                    })->get();

            case 'specific_parent': // تم تحديث المسمى ليطابق Create.tsx
            case 'specific_guardian':
                $guardianId = $filter['guardian_id'] ?? null;
                return User::where('id', $guardianId)->whereHas('roles', fn($q) => $q->where('name', 'parent'))->get();

            default:
                return collect();
        }
    }
}



