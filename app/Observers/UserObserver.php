<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

class UserObserver
{
    /**
     * Handle the User "saved" event.
     */
    public function saved(User $user): void
    {
        $this->clearCaches($user);
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        $this->clearCaches($user);
    }

    /**
     * Clear relevant counts when a user is modified.
     */
    protected function clearCaches(User $user): void
    {
        // 1. Dashboard stats (affected by any staff role change)
        Cache::forget('admin_dashboard_stats');

        // 2. Role-specific counts
        if ($user->role === 'driver') {
            Cache::forget('driver_counts');
        }

        if ($user->role === 'assistant') {
            Cache::forget('assistant_counts');
        }
        
        // 3. If school admin, we might need to clear school-specific caches if we had any,
        // but currently we have global counts.
    }
}
