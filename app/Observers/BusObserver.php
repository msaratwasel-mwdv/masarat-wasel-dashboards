<?php

namespace App\Observers;

use App\Models\Bus;
use App\Events\DashboardStatsUpdated;
use Illuminate\Support\Facades\Cache;

class BusObserver
{
    public function saved(Bus $bus): void
    {
        $this->clearCaches();
    }

    public function deleted(Bus $bus): void
    {
        $this->clearCaches();
    }

    protected function clearCaches(): void
    {
        // Bus changes affect dashboard stats (total, maintenance, booked/available)
        Cache::forget('admin_dashboard_stats');
        
        // Also affects staff assignment counts
        Cache::forget('driver_counts');
        Cache::forget('assistant_counts');
        
        // Affects analytics (fleet utilization)
        $monthKey = now()->format('Y-m');
        Cache::forget("analytics:kpis:{$monthKey}");
        
        broadcast(new DashboardStatsUpdated('buses', ['admin.dashboard']));
    }
}
