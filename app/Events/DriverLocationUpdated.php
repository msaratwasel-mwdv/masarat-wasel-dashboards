<?php

namespace App\Events;

use App\Models\Bus;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverLocationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Bus $bus,
        public float $latitude,
        public float $longitude,
        public float $heading = 0,
        public ?array $etaData = null,
        public ?float $targetLat = null,
        public ?float $targetLng = null
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('bus.' . $this->bus->id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'driver.location.updated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $activeTrip = $this->bus->activeTrip;

        return [
            'bus_id' => $this->bus->id,
            'bus_number' => $this->bus->bus_number,
            'plate_number' => $this->bus->plate_number,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'heading' => $this->heading,
            'target_lat' => $this->targetLat ?? $this->bus->target_latitude,
            'target_lng' => $this->targetLng ?? $this->bus->target_longitude,
            'trip_status' => $this->bus->trip_status,
            'speed_kmh' => cache()->get('bus_speed_' . $this->bus->id, 0),
            'eta_data' => $this->etaData,
            'total_students' => $this->bus->students_count,
            'departure_time' => $activeTrip ? $activeTrip->departure_time?->toIso8601String() : null,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
