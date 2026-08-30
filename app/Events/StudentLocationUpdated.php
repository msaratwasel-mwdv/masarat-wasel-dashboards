<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StudentLocationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $busId;

    public int $studentId;

    public function __construct(int $busId, int $studentId)
    {
        $this->busId = $busId;
        $this->studentId = $studentId;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('bus.'.$this->busId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'student.location.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'student_id' => $this->studentId,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
