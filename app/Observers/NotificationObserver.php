<?php

namespace App\Observers;

use App\Models\Notification;
use Illuminate\Support\Facades\Cache;

class NotificationObserver
{
    public function saved(Notification $notification): void
    {
        if ($notification->user_id) {
            Cache::forget("user_{$notification->user_id}_notifications_count");
        }
    }

    public function created(Notification $notification): void
    {
        // ⚠️ Broadcasting is handled by NotificationService::sendTranslatedToUser
        // to avoid duplicate pushes. Only invalidate cache here.
        if ($notification->user_id) {
            Cache::forget("user_{$notification->user_id}_notifications_count");
        }
    }

    public function deleted(Notification $notification): void
    {
        if ($notification->user_id) {
            Cache::forget("user_{$notification->user_id}_notifications_count");
        }
    }
}
