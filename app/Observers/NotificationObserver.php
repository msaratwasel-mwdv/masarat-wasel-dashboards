<?php

namespace App\Observers;

use App\Models\Notification;
use App\Events\NotificationPushed;
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
        if ($notification->user_id) {
            broadcast(new NotificationPushed($notification));
        }
    }

    public function deleted(Notification $notification): void
    {
        if ($notification->user_id) {
            Cache::forget("user_{$notification->user_id}_notifications_count");
        }
    }
}
