<?php

// c:\laragon\www\masarat-wasel-dashboards-new\app\Events\BusLocationUpdated.php

namespace App\Events;

use App\Models\Bus;
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
        public float $heading = 0,
        public ?int $studentsOnBoard = 0,
        public ?float $targetLat = null,
        public ?float $targetLng = null
    ) {}

    public function broadcastOn(): array
    {
        // بث الموقع لكل المتابعين لهذا الباص (سائقين، مشرفين، أولياء أمور)
        return [
            new PrivateChannel('bus.'.$this->bus->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'bus.location.updated';
    }

    public function broadcastWith(): array
    {
        $driver = $this->bus->driver?->user;
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
            'trip_type' => $activeTrip ? $activeTrip->type : null,
            'speed_kmh' => cache()->get('bus_speed_'.$this->bus->id, 0),
            'students_on_board' => $this->studentsOnBoard,
            'total_students' => $this->bus->students_count,
            'departure_time' => $activeTrip ? $activeTrip->departure_time?->toIso8601String() : null,
            'eta_minutes' => cache()->get('bus_eta_'.$this->bus->id),
            'driver' => $driver ? [
                'id' => $driver->id,
                'name' => $driver->name,
                'phone' => $driver->phone,
                'image_url' => $driver->image_url ? url($driver->image_url) : 'https://i.pravatar.cc/150?u='.$driver->id,
            ] : null,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
