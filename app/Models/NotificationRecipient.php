<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationRecipient extends Model
{
    protected $fillable = [
        'notification_id',
        'user_id',
        'status',
        'fcm_token',
        'error_message',
        'sent_at',
        'read_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    /**
     * Get the notification that owns this recipient record.
     */
    public function notification(): BelongsTo
    {
        return $this->belongsTo(Notification::class);
    }

    /**
     * Get the user (guardian) who is the recipient.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
