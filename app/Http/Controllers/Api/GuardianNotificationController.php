<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class GuardianNotificationController extends Controller
{
    /**
     * قائمة إشعارات ولي الأمر
     * GET /api/guardian/notifications
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        // جلب الإشعارات المباشرة (user_id) + إشعارات المدرسة (عبر notification_recipients)
        $notifications = Notification::activeOnly()->where(function ($query) use ($userId) {
            $query->where('user_id', $userId)
                ->orWhereHas('recipients', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                });
        })
            ->latest()
            ->paginate(100);

        // نحوّل كل إشعار إلى الشكل الذي يتوقعه Flutter
        $items = $notifications->map(function ($n) use ($userId) {
            // تحديد حالة القراءة: من الإشعار مباشرة أو من recipient record
            $isRead = $n->status === 'read';
            if (! $isRead && $n->user_id !== $userId) {
                $recipient = $n->recipients()->where('user_id', $userId)->first();
                $isRead = $recipient && $recipient->read_at !== null;
            }

            return [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'title_en' => $n->title_en,
                'message' => $n->message,
                'message_en' => $n->message_en,
                'data' => $n->data ?? [],
                'status' => $isRead ? 'read' : 'unread',
                'read' => $isRead,
                'from_user_name' => $n->from_user_name,
                'from_user_name_en' => $n->from_user_name_en,
                'icon' => $n->icon,
                'color' => $n->color,
                'created_at' => $n->created_at?->toIso8601String(),
            ];
        })->values();

        return response()->json([
            'notifications' => [
                'data' => $items,
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'total' => $notifications->total(),
                'per_page' => $notifications->perPage(),
            ],
            'unread_count' => Notification::activeOnly()->where(function ($query) use ($userId) {
                $query->where(function ($q) use ($userId) {
                    $q->where('user_id', $userId)->where('status', 'unread');
                })
                    ->orWhereHas('recipients', function ($q) use ($userId) {
                        $q->where('user_id', $userId)->whereNull('read_at');
                    });
            })
                ->count(),
        ]);
    }

    /**
     * وضع إشعار كمقروء
     * POST /api/guardian/notifications/{id}/read
     */
    public function markAsRead(Request $request, int $id)
    {
        $userId = $request->user()->id;

        $notification = Notification::activeOnly()->where(function ($query) use ($userId) {
            $query->where('user_id', $userId)
                ->orWhereHas('recipients', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                });
        })
            ->findOrFail($id);

        if ($notification->user_id === $userId) {
            $notification->markAsRead();
        } else {
            $notification->recipients()->where('user_id', $userId)->update([
                'read_at' => now(),
            ]);
        }

        return response()->json(['message' => 'تم وضع الإشعار كمقروء.']);
    }
}
