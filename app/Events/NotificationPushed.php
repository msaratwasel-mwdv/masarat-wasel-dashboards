<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class NotificationPushed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ?int $targetUserId = null;

    public function __construct(public Notification $notification, ?int $targetUserId = null)
    {
        $this->targetUserId = $targetUserId ?? $notification->user_id;
    }

    public function broadcastOn(): array
    {
        if (!$this->targetUserId) {
            return [];
        }
        
        return [
            new PrivateChannel('App.Models.User.' . $this->targetUserId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.pushed';
    }

    public function broadcastWith(): array
    {
        $unreadCount = 0;
        if ($this->targetUserId) {
            $unreadCount = Notification::where(function($q) {
                    $q->where('user_id', $this->targetUserId)
                      ->where('status', 'unread');
                })
                ->orWhereHas('recipients', function($q) {
                    $q->where('user_id', $this->targetUserId)
                      ->whereNull('read_at');
                })
                ->count();
        }

        return [
            'id' => $this->notification->id,
            'type' => $this->notification->type,
            'title' => $this->notification->title,
            'message' => $this->notification->message,
            'data' => $this->notification->data,
            'icon' => $this->notification->icon,
            'color' => $this->notification->color,
            'from_user_name' => $this->notification->from_user_name,
            'status' => $this->notification->status,
            'created_at' => $this->notification->created_at->toIso8601String(),
            'unread_count' => $unreadCount,
        ];
    }
}
