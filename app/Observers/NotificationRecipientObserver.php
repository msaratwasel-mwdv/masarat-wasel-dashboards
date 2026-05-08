<?php

namespace App\Observers;

use App\Models\NotificationRecipient;
use Illuminate\Support\Facades\Cache;

class NotificationRecipientObserver
{
    public function saved(NotificationRecipient $recipient): void
    {
        Cache::forget("user_{$recipient->user_id}_notifications_count");
    }

    public function deleted(NotificationRecipient $recipient): void
    {
        Cache::forget("user_{$recipient->user_id}_notifications_count");
    }
}
