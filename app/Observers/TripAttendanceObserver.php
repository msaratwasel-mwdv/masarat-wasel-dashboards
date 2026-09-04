<?php

namespace App\Observers;

use App\Events\DashboardStatsUpdated;
use App\Models\SystemEventLog;
use App\Models\TripAttendance;
use App\Services\WhatsAppService;
use Carbon\Carbon;
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
                $school = $trip?->school ?? $student?->school;
                $guardian = $student?->guardians?->first();

                if ($guardian && $guardian->phone) {
                    $isEn = ($guardian->preferred_language === 'en');
                    $lang = $isEn ? config('services.meta_whatsapp.english_code', 'en') : 'ar';
                    $templateName = $isEn
                        ? config('services.meta_whatsapp.templates.student_status_en', 'student_bus_status_en')
                        : config('services.meta_whatsapp.templates.student_status_ar', 'student_bus_status');

                    // 1. التاريخ
                    $tripDate = $trip?->trip_date ? Carbon::parse($trip->trip_date) : now();
                    $dateStr = $tripDate->format('Y/m/d');

                    // 2. اسم الطالب
                    $studentName = $isEn
                        ? (! empty($student?->full_name_en) ? $student->full_name_en : ($student?->full_name ?? 'Student'))
                        : ($student?->full_name ?? 'الطالب');

                    // 3. اسم المدرسة
                    $schoolName = $isEn
                        ? (! empty($school?->name_en) ? $school->name_en : ($school?->name ?? 'School'))
                        : ($school?->name ?? 'المدرسة');

                    // 4. تحديث الحالة
                    $statusText = $isEn ? 'Boarded the bus ✅' : 'صعد الحافلة ✅';

                    // دالة مساعدة لتنسيق الوقت صباحاً ومساءً
                    $formatTime = function ($dateTime, bool $isEnglish) {
                        if (! $dateTime) {
                            return $isEnglish ? now()->format('h:i A') : (now()->format('h:i').' '.(now()->format('A') === 'AM' ? 'ص' : 'م'));
                        }
                        $carbon = $dateTime instanceof Carbon ? $dateTime : Carbon::parse($dateTime);
                        if ($isEnglish) {
                            return $carbon->format('h:i A');
                        }
                        $period = $carbon->format('A') === 'AM' ? 'ص' : 'م';

                        return $carbon->format('h:i').' '.$period;
                    };

                    // 5. وقت وصول الحافلة للمنزل (إذا كان مسجلاً وقت الانتظار نستخدمه، وإلا وقت الصعود)
                    $arrivalDateTime = $attendance->waiting_start_time ?? $attendance->check_in_time ?? now();
                    $busArrivalTimeStr = $formatTime($arrivalDateTime, $isEn);

                    // 6. وقت الانتظار خارج المنزل
                    $waitMinutes = 0;
                    if ($attendance->waiting_start_time && $attendance->check_in_time) {
                        $diffSeconds = abs($attendance->check_in_time->diffInSeconds($attendance->waiting_start_time));
                        $waitMinutes = (int) round($diffSeconds / 60);
                    } elseif ($attendance->extra_wait_time) {
                        $waitMinutes = (int) $attendance->extra_wait_time;
                    }

                    if ($isEn) {
                        $waitingTimeStr = $waitMinutes > 0 ? "{$waitMinutes} mins" : '< 1 min';
                    } else {
                        $waitingTimeStr = $waitMinutes > 0 ? "{$waitMinutes} دقيقة" : 'أقل من دقيقة';
                    }

                    // 7. وقت صعود الطالب للحافلة
                    $boardDateTime = $attendance->check_in_time ?? now();
                    $studentBoardTimeStr = $formatTime($boardDateTime, $isEn);

                    // 8. اسم السائق
                    $driver = $bus?->driver;
                    $driverName = $isEn
                        ? (! empty($driver?->user?->name_en) ? $driver->user->name_en : ($driver?->user?->name ?? 'Driver'))
                        : ($driver?->user?->name ?? 'السائق');

                    // 9. اسم المشرفة
                    $assistant = $bus?->assistant;
                    $assistantName = $isEn
                        ? (! empty($assistant?->user?->name_en) ? $assistant->user->name_en : (! empty($assistant?->name_en) ? $assistant->name_en : ($assistant?->name ?? 'Supervisor')))
                        : ($assistant?->name ?? $assistant?->user?->name ?? 'المشرفة');

                    // 10. رقم الاتصال
                    $phone = $driver?->user?->phone ?? $assistant?->user?->phone ?? '77xxxxxxx';

                    $parameters = [
                        $dateStr,
                        $studentName,
                        $schoolName,
                        $statusText,
                        $busArrivalTimeStr,
                        $waitingTimeStr,
                        $studentBoardTimeStr,
                        $driverName,
                        $assistantName,
                        $phone,
                    ];

                    // تحديد رابط الصورة ديناميكياً
                    $imageUrl = url('assets/images/student_bus_status.png');
                    if (str_contains($imageUrl, 'localhost') || str_contains($imageUrl, '.test') || str_contains($imageUrl, '127.0.0.1')) {
                        $imageUrl = 'https://images.unsplash.com/photo-1557223562-6c77ef16210f?w=800';
                    }

                    // إرسال الإشعار عبر طابور المهام في الخلفية
                    \App\Jobs\SendWhatsAppTemplateJob::dispatch(
                        to: $guardian->phone,
                        templateName: $templateName,
                        parameters: $parameters,
                        lang: $lang,
                        headerImageUrl: $imageUrl,
                        eventType: 'student_boarded',
                        userId: $guardian->user_id ?? $guardian->id ?? null
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
