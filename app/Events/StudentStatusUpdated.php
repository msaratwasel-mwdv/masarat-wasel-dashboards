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
    public ?string $studentNameEn;
    public array $guardianIds = [];
    public string $busNumber;

    public function __construct(
        $student = null,
        $bus = null,
        public string $newStatus = 'unknown',
        public string $direction = 'none',
        // Optional raw overrides
        $studentId = null,
        $studentName = null,
        $studentNameEn = null,
        $guardianIds = null,
        $busNumber = null
    ) {
        $this->studentId = $studentId ?? ($student instanceof \App\Models\Student ? $student->id : (is_numeric($student) ? (int)$student : 0));
        $this->studentName = $studentName ?? ($student instanceof \App\Models\Student ? $student->full_name : 'جميع الطلاب');
        $this->studentNameEn = $studentNameEn ?? ($student instanceof \App\Models\Student ? $student->full_name_en : null);
        
        if ($guardianIds) {
            $this->guardianIds = is_array($guardianIds) ? $guardianIds : [$guardianIds];
        } elseif ($student instanceof \App\Models\Student) {
            $this->guardianIds = $student->guardians->pluck('id')->toArray();
        }
        
        $this->busNumber = $busNumber ?? ($bus instanceof \App\Models\Bus ? $bus->bus_number : ($bus ? (string)$bus : 'Unknown'));
    }

    /**
     * القنوات الخاصة بأولياء الأمور — جميع أولياء أمر الطالب يستقبلون الحدث
     */
    public function broadcastOn(): array
    {
        return array_map(function($id) {
            return new PrivateChannel('guardian.' . $id);
        }, $this->guardianIds);
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
            'student_name_en' => $this->studentNameEn,
            'new_status'   => $this->newStatus,
            'direction'    => $this->direction,
            'bus_number'   => $this->busNumber,
            'timestamp'    => now()->toIso8601String(),
        ];
    }
}


