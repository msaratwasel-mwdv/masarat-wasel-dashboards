<?php

namespace App\Events;

use App\Models\BusRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BusRequestStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public BusRequest $busRequest, public int $schoolAdminId) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.'.$this->schoolAdminId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'bus-request.status-changed';
    }

    public function broadcastWith(): array
    {
        $bus = $this->busRequest->bus;

        return [
            'id' => $this->busRequest->id,
            'status' => $this->busRequest->status,
            'rejection_reason' => $this->busRequest->rejection_reason,
            'request_type' => $this->busRequest->request_type,
            'seats' => $this->busRequest->seats,
            'bus' => $bus ? [
                'id' => $bus->id,
                'bus_number' => $bus->bus_number,
                'plate_number' => $bus->plate_number,
                'driver_name' => $bus->driver?->name,
            ] : null,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
