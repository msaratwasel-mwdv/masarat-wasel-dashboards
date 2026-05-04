<?php

namespace App\Observers;

use App\Models\TripAttendance;
use App\Models\SystemEventLog;
use Illuminate\Support\Facades\Auth;

class TripAttendanceObserver
{
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
    }
}
