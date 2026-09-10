<?php

namespace App\Observers;

use App\Events\DashboardStatsUpdated;
use App\Models\SystemEventLog;
use App\Models\Trip;
use App\Models\User;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class TripObserver
{
    public function __construct(protected WhatsAppService $whatsAppService) {}

    public function created(Trip $trip): void
    {
        try {
            $typeLabel = $trip->type === 'forth' ? 'الذهاب' : 'العودة';
            $typeLabelEn = $trip->type === 'forth' ? 'forth' : 'back';
            $dateStr = $trip->trip_date instanceof \Carbon\Carbon ? $trip->trip_date->toDateString() : $trip->trip_date;

            $notificationService = app(\App\Services\NotificationService::class);
            $notificationService->notifyBusCrew(
                busId: $trip->bus_id,
                type: 'trip_created',
                title: '🚌 رحلة جديدة جاهزة',
                message: "تم إنشاء رحلة جديدة ({$typeLabel}) لحافلتك بتاريخ {$dateStr}",
                data: [
                    'trip_id' => (string) $trip->id,
                    'category' => 'trips',
                    'target_screen' => 'trip_details',
                ],
                titleEn: '🚌 New Trip Ready',
                messageEn: "A new trip ({$typeLabelEn}) has been created for your bus on {$dateStr}"
            );
        } catch (\Exception $e) {
            \Log::error('TripObserver notification failed: '.$e->getMessage());
        }
    }

    public function updated(Trip $trip): void
    {
        if ($trip->isDirty('status')) {
            SystemEventLog::create([
                'event_type' => 'trip_state_transition',
                'entity_type' => 'Trip',
                'entity_id' => $trip->id,
                'user_id' => Auth::id(),
                'role' => Auth::user()?->role,
                'before_data' => ['status' => $trip->getOriginal('status')],
                'after_data' => ['status' => $trip->status],
            ]);

            // ميزة إرسال تقرير الرحلة التفصيلي عند انتهائها
            if ($trip->status === 'finished') {
                try {
                    $bus = $trip->bus;
                    $school = $trip->school;

                    $schoolAdmin = User::whereHas('schoolAdmin', function ($query) use ($trip) {
                        $query->where('school_id', $trip->school_id);
                    })->first();

                    $recipientPhone = $schoolAdmin?->phone ?: $school?->contact_phone;

                    if ($recipientPhone) {
                        $isEn = ($schoolAdmin && $schoolAdmin->preferred_language === 'en');
                        $lang = $isEn ? config('services.meta_whatsapp.english_code', 'en') : 'ar';
                        $templateName = $isEn
                            ? config('services.meta_whatsapp.templates.trip_summary_en', 'bus_trip_summary_en')
                            : config('services.meta_whatsapp.templates.trip_summary_ar', 'bus_trip_summary');

                        // حساب الحضور الحقيقي: كل طالب استقل الحافلة (سواء نزل 'dropped' أو 'boarded' أو سُجل له وقت صعود)
                        $attendanceCount = $trip->attendances()
                            ->where(function ($q) {
                                $q->whereIn('status', ['boarded', 'dropped'])
                                    ->orWhereNotNull('check_in_time');
                            })
                            ->count();

                        // حساب الغياب الحقيقي: الطلاب المسجل غيابهم أو اعتذارهم
                        $absenceCount = $trip->attendances()
                            ->whereIn('status', ['absent', 'excused'])
                            ->count();

                        // 1. حساب وتنسيق مدة الرحلة بدون كسور
                        if ($isEn) {
                            $durationStr = '30 mins';
                            if ($trip->departure_time && $trip->arrival_time) {
                                $minutes = (int) round($trip->departure_time->diffInMinutes($trip->arrival_time));
                                if ($minutes >= 60) {
                                    $hours = floor($minutes / 60);
                                    $remainingMins = $minutes % 60;
                                    $durationStr = $remainingMins > 0 ? "{$hours} hr {$remainingMins} mins" : "{$hours} hr";
                                } else {
                                    $durationStr = max(1, $minutes).' mins';
                                }
                            }
                        } else {
                            $durationStr = '30 دقيقة';
                            if ($trip->departure_time && $trip->arrival_time) {
                                $minutes = (int) round($trip->departure_time->diffInMinutes($trip->arrival_time));
                                if ($minutes >= 60) {
                                    $hours = floor($minutes / 60);
                                    $remainingMins = $minutes % 60;
                                    $durationStr = $remainingMins > 0 ? "{$hours} ساعة و {$remainingMins} دقيقة" : "{$hours} ساعة";
                                } else {
                                    $durationStr = max(1, $minutes).' دقيقة';
                                }
                            }
                        }

                        // 2. دالة مساعدة لتنسيق الوقت بدقة صباحاً ومساءً
                        $formatTime = function ($dateTime, bool $isEnglish, $defaultAr = '07:00 ص', $defaultEn = '07:00 AM') {
                            if (! $dateTime) {
                                return $isEnglish ? $defaultEn : $defaultAr;
                            }
                            $carbon = $dateTime instanceof Carbon ? $dateTime : Carbon::parse($dateTime);
                            if ($isEnglish) {
                                return $carbon->format('h:i A');
                            }
                            $period = $carbon->format('A') === 'AM' ? 'ص' : 'م';

                            return $carbon->format('h:i').' '.$period;
                        };

                        // 3. حساب مدة الانتظار الفعلية
                        $totalWaitMinutes = (int) $trip->attendances()->sum('extra_wait_time');
                        if ($isEn) {
                            $waitingStr = $totalWaitMinutes > 0 ? "{$totalWaitMinutes} mins" : '0 mins';
                        } else {
                            $waitingStr = $totalWaitMinutes > 0 ? "{$totalWaitMinutes} دقيقة" : '0 دقيقة';
                        }

                        // 4. معالجة المسافة الحقيقية للرحلة (الفعلية أولاً، ثم مسافة المسار كاحتياط)
                        $route = $trip->route ?? $bus?->route;
                        $distanceVal = (float) ($trip->actual_distance_km > 0
                            ? $trip->actual_distance_km
                            : ($route?->estimated_distance_km ?? 0));

                        $busDisplayName = $bus?->bus_number ?: ($bus?->plate_number ?: 'B-100');

                        if ($isEn) {
                            $distanceStr = $distanceVal > 0 ? (round($distanceVal, 1).' km') : '0 km';
                            $schoolName = ! empty($school?->name_en) ? $school->name_en : ($school?->name ?? 'Masarat Wasel');
                        } else {
                            $distanceStr = $distanceVal > 0 ? (round($distanceVal, 1).' كم') : '0 كم';
                            $schoolName = $school?->name ?? 'مسارات واصل';
                        }

                        $parameters = [
                            $schoolName,
                            $trip->trip_date ? Carbon::parse($trip->trip_date)->format('Y/m/d') : date('Y/m/d'),
                            $busDisplayName,
                            $formatTime($trip->departure_time, $isEn, '07:00 ص', '07:00 AM'),
                            $formatTime($trip->arrival_time, $isEn, '08:15 ص', '08:15 AM'),
                            $waitingStr,
                            $durationStr,
                            $distanceStr,
                            $attendanceCount,
                            $absenceCount,
                            $busDisplayName,
                        ];

                        // تحديد رابط صورة تقرير الرحلة
                        $imageUrl = url('assets/images/bus_trip_report.png');
                        if (str_contains($imageUrl, 'localhost') || str_contains($imageUrl, '.test') || str_contains($imageUrl, '127.0.0.1')) {
                            $imageUrl = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800';
                        }

                        // إرسال التقرير عبر طابور المهام في الخلفية
                        \App\Jobs\SendWhatsAppTemplateJob::dispatch(
                            to: $recipientPhone,
                            templateName: $templateName,
                            parameters: $parameters,
                            lang: $lang,
                            headerImageUrl: $imageUrl,
                            eventType: 'trip_finished_report',
                            userId: $schoolAdmin?->id
                        );
                    }
                } catch (\Exception $e) {
                    \Log::error('WhatsApp Trip Report failed: '.$e->getMessage());
                }
            }

            Cache::forget('admin_dashboard_stats');
            $monthKey = now()->format('Y-m');
            Cache::forget("analytics:kpis:{$monthKey}");

            $this->broadcastUpdate();
        }
    }

    public function saved(Trip $trip): void
    {
        Cache::forget('admin_dashboard_stats');
        $monthKey = now()->format('Y-m');
        Cache::forget("analytics:kpis:{$monthKey}");
        $this->broadcastUpdate();
    }

    public function deleted(Trip $trip): void
    {
        Cache::forget('admin_dashboard_stats');
        $monthKey = now()->format('Y-m');
        Cache::forget("analytics:kpis:{$monthKey}");
        $this->broadcastUpdate();
    }

    protected function broadcastUpdate(): void
    {
        \App\Helpers\BroadcastHelper::safeBroadcast(new DashboardStatsUpdated('trips', ['admin.dashboard']));
    }
}
