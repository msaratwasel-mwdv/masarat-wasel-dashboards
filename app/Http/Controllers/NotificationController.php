<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    /**
     * Display all notifications page.
     */
    public function page()
    {
        $notifications = Notification::where('user_id', auth()->id())
            ->latest()
            ->get();

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    /**
     * Get all notifications for the authenticated user (API).
     */
    public function index()
    {
        $notifications = Notification::where('user_id', auth()->id())
            ->latest()
            ->limit(50)
            ->get();

        $unreadCount = Notification::where('user_id', auth()->id())
            ->unread()
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead($id)
    {
        $notification = Notification::where('user_id', auth()->id())
            ->findOrFail($id);

        $notification->markAsRead();

        return back();
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead()
    {
        Notification::where('user_id', auth()->id())
            ->unread()
            ->update([
                'status' => 'read',
                'read_at' => now(),
            ]);

        return back();
    }

    /**
     * Delete a notification.
     */
    public function destroy($id)
    {
        $notification = Notification::where('user_id', auth()->id())
            ->findOrFail($id);

        $notification->delete();

        return back();
    }

    /**
     * Delete all notifications for the user.
     */
    public function destroyAll()
    {
        Notification::where('user_id', auth()->id())->delete();

        return back();
    }
}
