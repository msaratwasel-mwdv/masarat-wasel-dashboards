<?php

namespace App\Observers;

use App\Models\Trip;
use App\Models\SystemEventLog;
use App\Models\User;
use App\Events\DashboardStatsUpdated;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

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
                    'target_screen' => 'trip_details'
                ],
                titleEn: '🚌 New Trip Ready',
                messageEn: "A new trip ({$typeLabelEn}) has been created for your bus on {$dateStr}"
            );
        } catch (\Exception $e) {
            \Log::error('TripObserver notification failed: ' . $e->getMessage());
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

                    if ($schoolAdmin && $schoolAdmin->phone) {
                        $attendanceCount = $trip->attendances()->where('status', 'boarded')->count();
                        $absenceCount = $trip->attendances()->where('status', 'absent')->count();

                        $durationStr = '01:00 ساعة';
                        if ($trip->departure_time && $trip->arrival_time) {
                            $minutes = $trip->departure_time->diffInMinutes($trip->arrival_time);
                            $durationStr = $minutes . ' دقيقة';
                        }

                        $parameters = [
                            $school?->name ?? 'مسارات واصل',
                            $trip->trip_date ? Carbon::parse($trip->trip_date)->format('Y/m/d') : date('Y/m/d'),
                            $bus?->bus_number ?? 'B-202',
                            $trip->departure_time ? $trip->departure_time->format('h:i ص') : '07:00 ص',
                            $trip->arrival_time ? $trip->arrival_time->format('h:i ص') : '08:15 ص',
                            '00:15 دقيقة',
                            $durationStr,
                            $bus?->route?->estimated_distance_km ? $bus->route->estimated_distance_km . ' كم' : '25 كم',
                            $attendanceCount,
                            $absenceCount,
                            $bus?->bus_number ?? 'B-202'
                        ];

                        // تحديد رابط صورة تقرير الرحلة
                        $imageUrl = url('assets/images/bus_trip_report.png');
                        if (str_contains($imageUrl, 'localhost') || str_contains($imageUrl, '.test') || str_contains($imageUrl, '127.0.0.1')) {
                            // رابط الصورة التجريبية أثناء العمل المحلي (مع إمكانية تحميلها من النفق الفعلي)
                            $imageUrl = 'https://ringtones-broader-him-hist.trycloudflare.com/assets/images/bus_trip_report.png';
                        }

                        $this->whatsAppService->sendTemplate(
                            $schoolAdmin->phone,
                            'bus_trip_report',
                            $parameters,
                            'ar_AE',
                            $imageUrl
                        );
                    }
                } catch (\Exception $e) {
                    \Log::error('WhatsApp Trip Report failed: ' . $e->getMessage());
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
        broadcast(new DashboardStatsUpdated('trips', ['admin.dashboard']));
    }
}
