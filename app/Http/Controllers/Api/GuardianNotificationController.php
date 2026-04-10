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
        $notifications = Notification::where(function ($query) use ($userId) {
                $query->where('user_id', $userId)
                      ->orWhereHas('recipients', function ($q) use ($userId) {
                          $q->where('user_id', $userId);
                      });
            })
            ->latest()
            ->paginate(20);

        // نحوّل كل إشعار إلى الشكل الذي يتوقعه Flutter
        $items = $notifications->map(function ($n) use ($userId) {
            // تحديد حالة القراءة: من الإشعار مباشرة أو من recipient record
            $isRead = $n->status === 'read';
            if (!$isRead && $n->user_id !== $userId) {
                $recipient = $n->recipients()->where('user_id', $userId)->first();
                $isRead = $recipient && $recipient->read_at !== null;
            }

            return [
                'id'         => $n->id,
                'type'       => $n->type,
                'title'      => $n->title,
                'message'    => $n->message,
                'data'       => $n->data ?? [],
                'status'     => $isRead ? 'read' : 'unread',
                'read'       => $isRead,
                'created_at' => $n->created_at?->toIso8601String(),
            ];
        })->values();

        return response()->json([
            'notifications' => [
                'data'         => $items,
                'current_page' => $notifications->currentPage(),
                'last_page'    => $notifications->lastPage(),
                'total'        => $notifications->total(),
                'per_page'     => $notifications->perPage(),
            ],
            'unread_count' => Notification::where(function ($query) use ($userId) {
                    $query->where('user_id', $userId)->where('status', 'unread');
                })
                ->orWhereHas('recipients', function ($q) use ($userId) {
                    $q->where('user_id', $userId)->whereNull('read_at');
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
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json(['message' => 'تم وضع الإشعار كمقروء.']);
    }
}


