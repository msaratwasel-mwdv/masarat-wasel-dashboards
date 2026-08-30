<?php

namespace App\Events;

use App\Models\Student;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * يُبث فورياً عبر Reverb عند تسجيل غياب/حضور الطالب من قبل المعلم المدرسي
 * يستمع له تطبيق ولي الأمر عبر WebSocket لتحديث الواجهة مباشرة.
 */
class TeacherAttendanceMarked implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $student;

    public $status;

    public $date;

    public function __construct(Student $student, string $status, string $date)
    {
        $this->student = $student;
        $this->status = $status;
        $this->date = $date;
    }

    /**
     * القناة الخاصة بولي الأمر — فقط ولي أمر الطالب يستقبل الحدث
     */
    public function broadcastOn(): array
    {
        $channels = [];

        // Load guardians if not loaded
        if (! $this->student->relationLoaded('guardians')) {
            $this->student->load('guardians');
        }

        foreach ($this->student->guardians as $guardian) {
            $channels[] = new PrivateChannel('guardian.'.$guardian->id);
        }

        return $channels;
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
            'student_id' => $this->student->id,
            'student_name' => $this->student->full_name,
            'student_name_en' => $this->student->full_name_en,
            'status' => $this->status, // 'present' or 'absent'
            'date' => $this->date,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
