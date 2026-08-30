<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChatMonitorController extends Controller
{
    /**
     * عرض جميع المحادثات النشطة
     */
    public function index(Request $request)
    {
        $query = Conversation::with([
            'participants',
            'lastMessage.sender',
            'school',
            'chatParticipants',
        ])
            ->withCount('messages');

        // فلتر حسب المدرسة
        if ($request->filled('school_id')) {
            $query->where('school_id', $request->school_id);
        }

        // بحث بالاسم
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('participants', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $conversations = $query
            ->withMax('messages', 'created_at')
            ->orderByDesc('messages_max_created_at')
            ->paginate(20)
            ->through(function ($conversation) {
                return [
                    'id' => $conversation->id,
                    'type' => $conversation->type,
                    'title' => $conversation->title,
                    'school' => $conversation->school ? [
                        'id' => $conversation->school->id,
                        'name' => $conversation->school->name,
                    ] : null,
                    'participants' => $conversation->participants->map(fn ($p) => [
                        'id' => $p->id,
                        'name' => $p->name,
                        'role' => $p->role,
                    ]),
                    'last_message' => $conversation->lastMessage ? [
                        'body' => $conversation->lastMessage->body,
                        'sender' => $conversation->lastMessage->sender->name ?? '-',
                        'created_at' => $conversation->lastMessage->created_at->toISOString(),
                    ] : null,
                    'messages_count' => $conversation->messages_count,
                    'updated_at' => $conversation->updated_at->toISOString(),
                ];
            });

        $schools = \App\Models\School::select('id', 'name')->get();

        return Inertia::render('Admin/Chat/Index', [
            'conversations' => $conversations,
            'schools' => $schools,
            'filters' => $request->only(['search', 'school_id']),
        ]);
    }

    /**
     * عرض محادثة كاملة
     */
    public function show(Conversation $conversation)
    {
        $conversation->load(['participants', 'school']);

        $messages = $conversation->messages()
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->paginate(100);

        $formattedMessages = $messages->through(function ($msg) {
            return [
                'id' => $msg->id,
                'body' => $msg->body,
                'type' => $msg->type,
                'sender' => [
                    'id' => $msg->sender->id,
                    'name' => $msg->sender->name,
                    'role' => $msg->sender->role,
                ],
                'created_at' => $msg->created_at->toISOString(),
                'deleted_at' => $msg->deleted_at?->toISOString(),
            ];
        });

        return Inertia::render('Admin/Chat/Show', [
            'conversation' => [
                'id' => $conversation->id,
                'type' => $conversation->type,
                'title' => $conversation->title,
                'school' => $conversation->school ? [
                    'id' => $conversation->school->id,
                    'name' => $conversation->school->name,
                ] : null,
                'participants' => $conversation->participants->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'role' => $p->role,
                ]),
            ],
            'messages' => $formattedMessages,
        ]);
    }

    /**
     * حذف رسالة غير لائقة (soft delete)
     */
    public function deleteMessage(Message $message)
    {
        $message->delete(); // soft delete

        return back()->with('success', 'تم حذف الرسالة بنجاح.');
    }

    /**
     * إرسال تنبيه للمستخدم
     */
    public function alertUser(Request $request, User $user)
    {
        $request->validate([
            'alert_message' => 'required|string|max:1000',
        ]);

        // إنشاء إشعار للمستخدم
        \App\Models\Notification::create([
            'title' => 'تحذير إداري',
            'message' => $request->alert_message,
            'type' => 'admin_alert',
            'sender_id' => $request->user()->id,
            'user_id' => $user->id,
            'status' => 'unread',
            'icon' => 'warning',
            'color' => 'red',
            'data' => ['from' => 'admin_chat_monitor'],
        ]);

        return back()->with('success', 'تم إرسال التنبيه بنجاح.');
    }
}
