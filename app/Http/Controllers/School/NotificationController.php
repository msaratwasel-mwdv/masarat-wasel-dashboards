<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\NotificationTemplate;
use App\Models\Classroom;
use App\Models\Bus;
use App\Models\Guardian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\NotificationService;

class NotificationController extends Controller
{
    /**
     * @var NotificationService
     */
    protected $notificationService;

    /**
     * NotificationController constructor.
     * @param NotificationService $notificationService
     */
    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

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
        
        // Parents (Guardians) - optimizing query to only select needed fields
        $parents = Guardian::where('school_id', $schoolId)
            ->with(['user' => function($q) {
                $q->select('id', 'name', 'email');
            }])
            ->get()
            ->map(function($guardian) {
                return [
                    'id' => $guardian->id,
                    'name' => $guardian->full_name ?? ($guardian->user ? $guardian->user->name : 'Unknown'),
                    'email' => $guardian->email ?? ($guardian->user ? $guardian->user->email : ''),
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
        // تم إضافة guardians هنا لأن الواجهة Create.tsx تتوقعها في الـ Props
        $guardians = Guardian::where('school_id', $schoolId)->with('user')->get();

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
            'count'      => $recipients->count(),
            'total_recipients' => $recipients->count(),
            'title'      => $request->title,
            'message'    => $request->message,
            'recipients' => $recipients->take(5)->map(function ($guardian) {
                $name = $guardian->name
                    ?? $guardian->name_en
                    ?? ($guardian->user ? $guardian->user->name : null)
                    ?? $guardian->phone
                    ?? 'Unknown';
                return [
                    'name'          => $name,
                    'has_fcm_token' => !empty($guardian->user?->fcm_token),
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

        $schoolId = Auth::user()->school_id;
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
            foreach ($recipients as $guardian) {
                $userId = $guardian->user_id ?? ($guardian->user ? $guardian->user->id : null);
                $token = $guardian->user->fcm_token ?? null;
                
                if ($userId) {
                    $notification->recipients()->create([
                        'user_id' => $userId,
                        'fcm_token' => $token,
                        'status' => 'pending',
                    ]);

                    if ($token) {
                        $fcmTokens[] = $token;
                    }
                }
            }

            DB::commit();

            // إرسال الإشعار فعلياً عبر Firebase
            if (!empty($fcmTokens)) {
                $this->notificationService->sendMulticast(
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
            }

            return redirect()->route('school.notifications.index')
                ->with('success', 'تم إرسال الإشعار بنجاح لـ ' . count($fcmTokens) . ' مستخدم');

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
     */
    private function getRecipients($schoolId, $recipientType, $filter)
    {
        switch ($recipientType) {
            case 'all_parents':
                return Guardian::where('school_id', $schoolId)->with('user')->get();

            case 'by_classroom': // تم تحديث المسمى ليطابق Create.tsx
            case 'class_students':
                $classroomIds = $filter['classroom_ids'] ?? [];
                return Guardian::where('school_id', $schoolId)
                    ->whereHas('students', function ($q) use ($classroomIds) {
                        $q->whereIn('classroom_id', $classroomIds); 
                    })->with('user')->get();

            case 'by_bus': // تم تحديث المسمى ليطابق Create.tsx
            case 'bus_students':
                $busIds = $filter['bus_ids'] ?? [];
                return Guardian::where('school_id', $schoolId)
                    ->whereHas('students.buses', function ($q) use ($busIds) {
                        $q->whereIn('buses.id', $busIds);
                    })->with('user')->get();

            case 'specific_parent': // تم تحديث المسمى ليطابق Create.tsx
            case 'specific_guardian':
                $guardianId = $filter['guardian_id'] ?? null;
                return Guardian::where('id', $guardianId)->with('user')->get();

            default:
                return collect();
        }
    }
}
