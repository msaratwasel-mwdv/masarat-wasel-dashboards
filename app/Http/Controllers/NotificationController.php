<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\NotificationRecipient;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    /**
     * Get notification IDs for the current user (direct + via recipients table).
     * Excludes transient student/trip/attendance notifications older than 24 hours.
     */
    private function getUserNotificationQuery()
    {
        $userId = auth()->id();

        // Get notification IDs from the recipients table
        $recipientNotificationIds = NotificationRecipient::where('user_id', $userId)
            ->pluck('notification_id');

        // Query notifications where user_id matches OR notification is in recipients table
        return Notification::activeOnly()->where(function ($query) use ($userId, $recipientNotificationIds) {
            $query->where('user_id', $userId)
                  ->orWhereIn('id', $recipientNotificationIds);
        });
    }

    /**
     * Display all notifications page.
     */
    public function page()
    {
        $notifications = $this->getUserNotificationQuery()
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
        $notifications = $this->getUserNotificationQuery()
            ->latest()
            ->limit(50)
            ->get();

        $unreadCount = $this->getUserNotificationQuery()
            ->whereIn('status', ['sent', 'unread'])
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
        $userId = auth()->id();

        // Check if user has access (direct or via recipients)
        $notification = Notification::where(function ($q) use ($userId) {
            $q->where('user_id', $userId)
              ->orWhereHas('recipients', function ($rq) use ($userId) {
                  $rq->where('user_id', $userId);
              });
        })->findOrFail($id);

        $notification->markAsRead();

        // Also mark the recipient record as read
        NotificationRecipient::where('notification_id', $id)
            ->where('user_id', $userId)
            ->update(['status' => 'read', 'read_at' => now()]);

        return back();
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead()
    {
        $userId = auth()->id();

        // Mark direct notifications
        Notification::where('user_id', $userId)
            ->where('status', '!=', 'read')
            ->update([
                'status' => 'read',
                'read_at' => now(),
            ]);

        // Mark recipient records
        $recipientNotificationIds = NotificationRecipient::where('user_id', $userId)
            ->where('status', '!=', 'read')
            ->pluck('notification_id');

        NotificationRecipient::where('user_id', $userId)
            ->update(['status' => 'read', 'read_at' => now()]);

        // Also update the notification status if all recipients have read it
        foreach ($recipientNotificationIds as $notifId) {
            $unreadCount = NotificationRecipient::where('notification_id', $notifId)
                ->where('status', '!=', 'read')
                ->count();
            if ($unreadCount === 0) {
                Notification::where('id', $notifId)->update(['status' => 'read', 'read_at' => now()]);
            }
        }

        return back();
    }

    /**
     * Delete a notification.
     */
    public function destroy($id)
    {
        $userId = auth()->id();

        $notification = Notification::where(function ($q) use ($userId) {
            $q->where('user_id', $userId)
              ->orWhereHas('recipients', function ($rq) use ($userId) {
                  $rq->where('user_id', $userId);
              });
        })->findOrFail($id);

        // If it's a recipient-based notification, just remove the recipient record
        $recipientRecord = NotificationRecipient::where('notification_id', $id)
            ->where('user_id', $userId)
            ->first();

        if ($recipientRecord) {
            $recipientRecord->delete();
        } else {
            $notification->delete();
        }

        return back();
    }

    /**
     * Delete all notifications for the user.
     */
    public function destroyAll()
    {
        $userId = auth()->id();

        // Delete direct notifications
        Notification::where('user_id', $userId)->delete();

        // Delete recipient records
        NotificationRecipient::where('user_id', $userId)->delete();

        return back();
    }
}
