<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'message',
        'data',
        'user_id',
        'from_user_name',
        'status',
        'icon',
        'color',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    /**
     * Get the user that owns the notification.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mark notification as read.
     */
    public function markAsRead(): void
    {
        $this->update([
            'status' => 'read',
            'read_at' => now(),
        ]);
    }

    /**
     * Check if notification is unread.
     */
    public function isUnread(): bool
    {
        return $this->status === 'unread';
    }

    /**
     * Scope for unread notifications.
     */
    public function scopeUnread($query)
    {
        return $query->where('status', 'unread');
    }

    /**
     * Scope for read notifications.
     */
    public function scopeRead($query)
    {
        return $query->where('status', 'read');
    }

    /**
     * Scope for recent notifications.
     */
    public function scopeRecent($query, $limit = 10)
    {
        return $query->latest()->limit($limit);
    }
}
