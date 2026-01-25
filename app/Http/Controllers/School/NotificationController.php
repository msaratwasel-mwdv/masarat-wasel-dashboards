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
            'recipients' => $recipients->take(5)->map(function ($guardian) {
                return [
                    'name' => $guardian->user->name ?? $guardian->full_name,
                    'has_fcm_token' => !empty($guardian->user->fcm_token) || !empty($guardian->fcm_token),
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
                'type' => $validated['type'], // Store the selected type directly
                'template_type' => $validated['type'], // Optional: store as template_type too if needed
                'sender_id' => Auth::id(),
                'recipient_type' => $validated['recipient_type'],
                'recipient_filter' => $validated['recipient_filter'],
                'total_recipients' => $recipients->count(),
                'status' => 'pending',
                // Store original bilingual data in 'data' column if needed for future editing
                'data' => [
                    'title_en' => $validated['title_en'],
                    'title_ar' => $validated['title_ar'],
                    'body_en' => $validated['body_en'],
                    'body_ar' => $validated['body_ar'],
                    'template_id' => $validated['template_id'] ?? null,
                ]
            ]);

            // Create recipient records
            foreach ($recipients as $guardian) {
                // Check if user relation exists, otherwise fallback or skip
                $userId = $guardian->user_id ?? ($guardian->user ? $guardian->user->id : null);
                
                // If guardian has no user account, we might not be able to send in-app/fcm notification easily
                // But we still record it. Using guardian ID if user_id is missing might be an option if table supports it,
                // but assuming 'notification_recipients' links to 'users'.
                
                if ($userId) {
                    $notification->recipients()->create([
                        'user_id' => $userId,
                        'fcm_token' => $guardian->user->fcm_token ?? null,
                        'status' => 'pending',
                    ]);
                }
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
     */
    private function getRecipients($schoolId, $recipientType, $filter)
    {
        switch ($recipientType) {
            case 'all_parents':
                return Guardian::where('school_id', $schoolId)->with('user')->get();

            case 'class_students':
                $classroomIds = $filter['classroom_ids'] ?? [];
                // Find guardians linked to students in these classrooms
                return Guardian::where('school_id', $schoolId)
                    ->whereHas('students', function ($q) use ($classroomIds) {
                        $q->whereIn('classroom_id', $classroomIds); // Assuming student has classroom_id directly or through enrollment
                    })->with('user')->get();

            case 'bus_students':
                $busIds = $filter['bus_ids'] ?? [];
                return Guardian::where('school_id', $schoolId)
                    ->whereHas('students.buses', function ($q) use ($busIds) {
                        $q->whereIn('buses.id', $busIds);
                    })->with('user')->get();

            case 'specific_guardian':
                $guardianId = $filter['guardian_id'] ?? null;
                return Guardian::where('id', $guardianId)->with('user')->get();

            default:
                return collect();
        }
    }
}
