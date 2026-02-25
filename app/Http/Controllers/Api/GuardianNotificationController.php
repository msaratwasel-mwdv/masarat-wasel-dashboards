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

        $notifications = Notification::where('user_id', $userId)
            ->latest()
            ->paginate(20);

        // نحوّل كل إشعار إلى الشكل الذي يتوقعه Flutter
        $items = $notifications->map(function ($n) {
            return [
                'id'         => $n->id,
                'type'       => $n->type,
                'title'      => $n->title,
                'message'    => $n->message,
                'data'       => $n->data ?? [],
                'status'     => $n->status,
                'read'       => $n->status === 'read',
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
            'unread_count' => Notification::where('user_id', $userId)
                ->unread()
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
