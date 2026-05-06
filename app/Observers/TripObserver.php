<?php

namespace App\Observers;

use App\Models\Trip;
use App\Models\SystemEventLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class TripObserver
{
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
        }
    }

    public function saved(Trip $trip): void
    {
        Cache::forget('admin_dashboard_stats');
        $monthKey = now()->format('Y-m');
        Cache::forget("analytics:kpis:{$monthKey}");
    }

    public function deleted(Trip $trip): void
    {
        Cache::forget('admin_dashboard_stats');
        $monthKey = now()->format('Y-m');
        Cache::forget("analytics:kpis:{$monthKey}");
    }
}
