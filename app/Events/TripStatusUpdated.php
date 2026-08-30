<?php

namespace App\Events;

use App\Models\Bus;
use App\Models\Trip;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TripStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Trip $trip,
        public Bus $bus,
        public string $status
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('bus.'.$this->bus->id),
            new PrivateChannel('trip.'.$this->trip->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'trip.status.updated';
    }

    public function broadcastWith(): array
    {
        // عند انتهاء الرحلة نُرسل trip_type كـ null حتى يتمكن تطبيق ولي الأمر
        // من الخروج من الحالة المعلقة (Sticky Status Bug Fix)
        $isTerminal = in_array($this->status, ['finished', 'completed', 'idle', 'cancelled']);

        return [
            'trip_id' => $this->trip->id,
            'bus_id' => $this->bus->id,
            'status' => $this->status,
            'trip_type' => $isTerminal ? null : $this->trip->type,
            'target_lat' => $this->bus->target_latitude,
            'target_lng' => $this->bus->target_longitude,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
