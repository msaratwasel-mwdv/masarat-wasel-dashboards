<?php

namespace App\Events;

use App\Models\Incident;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EmergencyReported implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Incident $emergency) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.emergencies'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'emergency.reported';
    }

    public function broadcastWith(): array
    {
        $this->emergency->loadMissing(['bus', 'reporter']);

        return [
            'id' => $this->emergency->id,
            'type' => $this->emergency->type,
            'severity' => $this->emergency->severity,
            'description' => $this->emergency->description,
            'status' => $this->emergency->status,
            'bus' => $this->emergency->bus ? [
                'bus_code' => $this->emergency->bus->bus_code,
                'bus_number' => $this->emergency->bus->bus_number,
            ] : null,
            'reporter' => $this->emergency->reporter ? [
                'name' => $this->emergency->reporter->name,
                'role' => $this->emergency->reporter->role,
            ] : null,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
