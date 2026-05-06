<?php

namespace App\Observers;

use Illuminate\Support\Facades\Cache;

class AnalyticsCacheObserver
{
    public function saved(): void
    {
        $this->clearAnalyticsCache();
    }

    public function deleted(): void
    {
        $this->clearAnalyticsCache();
    }

    protected function clearAnalyticsCache(): void
    {
        $monthKey = now()->format('Y-m');
        Cache::forget("analytics:kpis:{$monthKey}");
        
        // Also affects dashboard safe trips % if relevant
        Cache::forget('admin_dashboard_stats');
    }
}
