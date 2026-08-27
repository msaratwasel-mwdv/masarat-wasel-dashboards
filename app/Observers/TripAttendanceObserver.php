<?php

namespace App\Observers;

use App\Events\DashboardStatsUpdated;
use App\Models\SystemEventLog;
use App\Models\TripAttendance;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class TripAttendanceObserver
{
    public function __construct(protected WhatsAppService $whatsAppService) {}

    public function updated(TripAttendance $attendance): void
    {
        if ($attendance->isDirty('status')) {
            SystemEventLog::create([
                'event_type' => 'student_status_transition',
                'entity_type' => 'TripAttendance',
                'entity_id' => $attendance->id,
                'user_id' => Auth::id(),
                'role' => Auth::user()?->role,
                'before_data' => ['status' => $attendance->getOriginal('status')],
                'after_data' => ['status' => $attendance->status],
            ]);

            Cache::forget('admin_dashboard_stats');

            // إرسال الإشعار عند صعود الطالب إلى الحافلة
            if ($attendance->status === 'boarded') {
                $student = $attendance->student;
                $trip = $attendance->trip;
                $bus = $trip?->bus;
                $guardian = $student?->guardians?->first();

                if ($guardian && $guardian->phone) {
                    $parameters = [
                        $guardian->name,
                        $student?->full_name ?? 'أحمد فضل',
                        'صعد الحافلة ✅',
                        $bus?->driver?->user?->name ?? 'نجيب الصلوان',
                        $bus?->assistant?->name ?? 'فاطمة علي',
                        $bus?->driver?->user?->phone ?? '77xxxxxxx',
                        $trip?->school?->name ?? 'المدرسة العصرية الحديثة',
                    ];

                    // تحديد رابط الصورة ديناميكياً، مع وضع رابط خارجي كاحتياط أثناء العمل المحتلي على Laragon
                    $imageUrl = url('assets/images/student_bus_status.png');
                    if (str_contains($imageUrl, 'localhost') || str_contains($imageUrl, '.test') || str_contains($imageUrl, '127.0.0.1')) {
                        $imageUrl = 'https://images.unsplash.com/photo-1557223562-6c77ef16210f?w=500';
                    }

                    $this->whatsAppService->sendTemplate(
                        $guardian->phone,
                        'student_bus_status',
                        $parameters,
                        'ar',
                        $imageUrl
                    );
                }
            }

            $this->broadcastUpdate();
        }
    }

    public function created(TripAttendance $attendance): void
    {
        SystemEventLog::create([
            'event_type' => 'student_status_transition',
            'entity_type' => 'TripAttendance',
            'entity_id' => $attendance->id,
            'user_id' => Auth::id(),
            'role' => Auth::user()?->role,
            'before_data' => null,
            'after_data' => ['status' => $attendance->status],
        ]);

        Cache::forget('admin_dashboard_stats');
        $this->broadcastUpdate();
    }

    protected function broadcastUpdate(): void
    {
        broadcast(new DashboardStatsUpdated('attendance', ['admin.dashboard']));
    }
}
