<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * يُبث فورياً عبر Reverb عند كل تغيير حالة طالب (boarding / alighting)
 * يستمع له تطبيق ولي الأمر عبر WebSocket لتحديث الواجهة مباشرة.
 */
class StudentStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $studentId;
    public string $studentName;
    public int $guardianId;
    public string $busNumber;

    public function __construct(
        $student = null,
        $bus = null,
        public string $newStatus = 'unknown',
        public string $direction = 'none',
        // Optional raw overrides
        $studentId = null,
        $studentName = null,
        $guardianId = null,
        $busNumber = null
    ) {
        $this->studentId = $studentId ?? ($student instanceof \App\Models\Student ? $student->id : (is_numeric($student) ? (int)$student : 0));
        $this->studentName = $studentName ?? ($student instanceof \App\Models\Student ? $student->full_name : 'جميع الطلاب');
        $this->guardianId = $guardianId ?? ($student instanceof \App\Models\Student ? ($student->guardian->first()?->id ?? 0) : 0);
        $this->busNumber = $busNumber ?? ($bus instanceof \App\Models\Bus ? $bus->bus_number : ($bus ? (string)$bus : 'Unknown'));
    }

    /**
     * القناة الخاصة بولي الأمر — فقط ولي أمر الطالب يستقبل الحدث
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('guardian.' . $this->guardianId),
        ];
    }

    /**
     * اسم الحدث المُرسَل للعميل
     */
    public function broadcastAs(): string
    {
        return 'student.status.updated';
    }

    /**
     * البيانات المُرسَلة عبر WebSocket
     */
    public function broadcastWith(): array
    {
        return [
            'student_id'   => $this->studentId,
            'student_name' => $this->studentName,
            'new_status'   => $this->newStatus,
            'direction'    => $this->direction,
            'bus_number'   => $this->busNumber,
            'timestamp'    => now()->toIso8601String(),
        ];
    }
}


