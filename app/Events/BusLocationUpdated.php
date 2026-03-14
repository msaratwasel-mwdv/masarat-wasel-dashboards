<?php
// c:\laragon\www\masarat-wasel-dashboards-new\app\Events\BusLocationUpdated.php

namespace App\Events;

use App\Models\Bus;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BusLocationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Bus $bus,
        public float $latitude,
        public float $longitude,
        public ?int $studentsOnBoard = 0
    ) {}

    public function broadcastOn(): array
    {
        // بث الموقع لكل المتابعين لهذا الباص (سائقين، مشرفين، أولياء أمور)
        return [
            new PrivateChannel('bus.' . $this->bus->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'bus.location.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'bus_id'            => $this->bus->id,
            'latitude'          => $this->latitude,
            'longitude'         => $this->longitude,
            'trip_status'       => $this->bus->trip_status,
            'students_on_board' => $this->studentsOnBoard,
            'timestamp'         => now()->toIso8601String(),
        ];
    }
}
