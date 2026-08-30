<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DashboardStatsUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public string $key, public array $channels) {}

    public function broadcastOn(): array
    {
        return array_map(fn ($ch) => new PrivateChannel($ch), $this->channels);
    }

    public function broadcastAs(): string
    {
        return 'dashboard.stats.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'key' => $this->key,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
