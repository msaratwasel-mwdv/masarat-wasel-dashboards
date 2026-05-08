<?php

namespace App\Events;

use App\Models\BusRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BusRequestCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public BusRequest $busRequest, public int $adminId)
    {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.' . $this->adminId),
            new PrivateChannel('admin.bus-requests'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'bus-request.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->busRequest->id,
            'school_name' => $this->busRequest->school->name ?? 'Unknown',
            'request_type' => $this->busRequest->request_type,
            'seats' => $this->busRequest->seats,
            'status' => $this->busRequest->status,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
