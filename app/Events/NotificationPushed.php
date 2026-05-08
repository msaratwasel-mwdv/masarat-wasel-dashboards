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

    public function __construct(public Notification $notification)
    {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.' . $this->notification->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.pushed';
    }

    public function broadcastWith(): array
    {
        $unreadCount = Cache::remember("user_{$this->notification->user_id}_notifications_count", 60 * 24, function () {
            return Notification::where('user_id', $this->notification->user_id)
                ->where('status', 'unread')
                ->count();
        });

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
