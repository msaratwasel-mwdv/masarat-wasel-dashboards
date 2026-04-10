<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Student;

/**
 * يُبث فورياً عبر Reverb عند تسجيل غياب/حضور الطالب من قبل المعلم المدرسي
 * يستمع له تطبيق ولي الأمر عبر WebSocket لتحديث الواجهة مباشرة.
 */
class TeacherAttendanceMarked implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $studentId;
    public $studentName;
    public $guardianId;
    public $status;
    public $date;

    public function __construct(Student $student, string $status, string $date)
    {
        $this->studentId = $student->id;
        $this->studentName = $student->full_name;
        $this->guardianId = $student->guardian_id;
        $this->status = $status;
        $this->date = $date;
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
        return 'teacher.attendance.marked';
    }

    /**
     * البيانات المُرسَلة عبر WebSocket
     */
    public function broadcastWith(): array
    {
        return [
            'student_id'   => $this->studentId,
            'student_name' => $this->studentName,
            'status'       => $this->status, // 'present' or 'absent'
            'date'         => $this->date,
            'timestamp'    => now()->toIso8601String(),
        ];
    }
}


