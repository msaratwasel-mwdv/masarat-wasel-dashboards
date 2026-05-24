<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class NotificationPushed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public ?int $targetUserId = null;
    public ?string $correlationId = null;

    public function __construct(public Notification $notification, ?int $targetUserId = null, ?string $correlationId = null)
    {
        $this->targetUserId = $targetUserId ?? $notification->user_id;
        $this->correlationId = $correlationId;
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
            $unreadCount = Notification::activeOnly()->where(function($q) {
                    $q->where(function($sub) {
                        $sub->where('user_id', $this->targetUserId)
                            ->where('status', 'unread');
                    })
                    ->orWhereHas('recipients', function($sub) {
                        $sub->where('user_id', $this->targetUserId)
                            ->whereNull('read_at');
                    });
                })
                ->count();
        }

        $user = \App\Models\User::find($this->targetUserId);
        $lang = $user ? ($user->preferred_language ?? 'ar') : 'ar';

        return [
            'id' => $this->notification->id ?? (string) ($this->notification->data['message_id'] ?? $this->correlationId),
            'type' => $this->notification->type,
            'title' => $this->notification->title,
            'title_en' => $this->notification->title_en,
            'message' => $this->notification->message,
            'message_en' => $this->notification->message_en,
            'data' => array_merge($this->notification->data ?? [], ['language' => $lang]),
            'icon' => $this->notification->icon,
            'color' => $this->notification->color,
            'from_user_name' => $this->notification->from_user_name,
            'from_user_name_en' => $this->notification->from_user_name_en,
            'status' => $this->notification->status,
            'created_at' => ($this->notification->created_at ?? now())->toIso8601String(),
            'unread_count' => $unreadCount,
            'correlation_id' => $this->correlationId,
        ];
    }
}
