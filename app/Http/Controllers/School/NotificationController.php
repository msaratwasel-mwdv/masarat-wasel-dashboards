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

class NotificationController extends Controller
{
    /**
     * Display a listing of notifications sent by this school.
     */
    public function index(Request $request)
    {
        $schoolId = Auth::user()->school_id;

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
            ->where('role', 'parent')
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
        $schoolId = Auth::user()->school_id;

        $templates = NotificationTemplate::active()->get();
        $classrooms = Classroom::where('school_id', $schoolId)->get();
        $buses = Bus::where('school_id', $schoolId)->get();

        return Inertia::render('School/Notifications/Create', [
            'templates' => $templates,
            'classrooms' => $classrooms,
            'buses' => $buses,
        ]);
    }

    /**
     * Preview recipient count and list.
     */
    public function preview(Request $request)
    {
        $schoolId = Auth::user()->school_id;

        $recipientType = $request->recipient_type;
        $filter = $request->recipient_filter ?? [];

        $recipients = $this->getRecipients($schoolId, $recipientType, $filter);

        return response()->json([
            'count' => $recipients->count(),
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
            'title_en' => 'required|string|max:255',
            'title_ar' => 'required|string|max:255',
            'body_en' => 'required|string',
            'body_ar' => 'required|string',
            'type' => 'required|string', // Matches 'type' from modal
            'recipient_type' => 'required|string',
            'recipient_filter' => 'nullable|array',
            'template_id' => 'nullable|exists:notification_templates,id',
        ]);

        $schoolId = Auth::user()->school_id;
        $recipients = $this->getRecipients($schoolId, $validated['recipient_type'], $validated['recipient_filter'] ?? []);

        // Concatenate English and Arabic for storage
        // Format: "English | Arabic"
        $title = $validated['title_en'] . ' | ' . $validated['title_ar'];
        $message = $validated['body_en'] . ' | ' . $validated['body_ar'];

        DB::beginTransaction();
        try {
            // Create the notification
            $notification = Notification::create([
                'title' => $title,
                'message' => $message,
                'type' => $validated['type'],
                'template_type' => $validated['type'],
                'sender_id' => Auth::id(),
                'recipient_type' => $validated['recipient_type'],
                'recipient_filter' => $validated['recipient_filter'],
                'total_recipients' => $recipients->count(),
                'status' => 'pending',
                'data' => [
                    'title_en' => $validated['title_en'],
                    'title_ar' => $validated['title_ar'],
                    'body_en' => $validated['body_en'],
                    'body_ar' => $validated['body_ar'],
                    'template_id' => $validated['template_id'] ?? null,
                ]
            ]);

            // Create recipient records
            foreach ($recipients as $parentUser) {
                $notification->recipients()->create([
                    'user_id' => $parentUser->id,
                    'fcm_token' => $parentUser->fcm_token ?? null,
                    'status' => 'pending',
                ]);
            }

            DB::commit();

            // TODO: Dispatch job to send real notifications
            // SendNotificationJob::dispatch($notification);

            return redirect()->route('school.notifications.index')
                ->with('success', 'تم إنشاء الإشعار وسيتم إرساله قريباً');
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
                return User::where('school_id', $schoolId)->where('role', 'parent')->get();

            case 'class_students':
                $classroomIds = $filter['classroom_ids'] ?? [];
                // أولياء الأمور الذين لديهم طلاب في هذه الفصول
                return User::where('school_id', $schoolId)
                    ->where('role', 'parent')
                    ->whereHas('students', function ($q) use ($classroomIds) {
                        $q->whereHas('currentEnrollment', function ($eq) use ($classroomIds) {
                            $eq->whereIn('classroom_id', $classroomIds);
                        });
                    })->get();

            case 'bus_students':
                $busIds = $filter['bus_ids'] ?? [];
                return User::where('school_id', $schoolId)
                    ->where('role', 'parent')
                    ->whereHas('students.buses', function ($q) use ($busIds) {
                        $q->whereIn('buses.id', $busIds);
                    })->get();

            case 'specific_guardian':
                $guardianId = $filter['guardian_id'] ?? null;
                return User::where('id', $guardianId)->where('role', 'parent')->get();

            default:
                return collect();
        }
    }
}
