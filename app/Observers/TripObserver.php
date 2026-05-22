<?php

namespace App\Observers;

use App\Models\Trip;
use App\Models\SystemEventLog;
use App\Events\DashboardStatsUpdated;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class TripObserver
{
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

            // Clear analytics and dashboard cache when trip status changes
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
