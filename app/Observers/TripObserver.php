<?php

namespace App\Observers;

use App\Models\Trip;
use App\Models\SystemEventLog;
use Illuminate\Support\Facades\Auth;

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
        }
    }
}
