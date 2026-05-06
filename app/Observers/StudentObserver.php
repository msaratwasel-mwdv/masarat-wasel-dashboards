<?php

namespace App\Observers;

use App\Models\Student;
use App\Models\SystemEventLog;
use App\Events\StudentLocationUpdated;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class StudentObserver
{
    public function saved(Student $student): void
    {
        Cache::forget('admin_dashboard_stats');
    }

    public function deleted(Student $student): void
    {
        Cache::forget('admin_dashboard_stats');
    }

    /**
     * Handle the Student "updated" event.
     * Propagates home location coordinate changes to the driver via broadcast.
     */
    public function updated(Student $student): void
    {
        // ── Audit: log any coordinate changes ──
        $coordinateFields = [
            'latitude', 'longitude',
            'forth_latitude', 'forth_longitude',
            'back_latitude', 'back_longitude',
        ];

        $changed = array_intersect($coordinateFields, array_keys($student->getDirty()));

        if (!empty($changed)) {
            $beforeData = [];
            $afterData  = [];
            foreach ($changed as $field) {
                $beforeData[$field] = $student->getOriginal($field);
                $afterData[$field]  = $student->$field;
            }

            SystemEventLog::create([
                'event_type'  => 'student_location_update',
                'entity_type' => 'Student',
                'entity_id'   => $student->id,
                'user_id'     => Auth::id(),
                'role'        => Auth::user()?->role,
                'before_data' => $beforeData,
                'after_data'  => $afterData,
            ]);

            // ── Broadcast invalidation to the driver's bus channel ──
            $busIds = array_filter(array_unique([
                $student->forth_bus_id,
                $student->back_bus_id,
            ]));

            foreach ($busIds as $busId) {
                try {
                    broadcast(new StudentLocationUpdated($busId, $student->id));
                } catch (\Exception $e) {
                    Log::error("StudentObserver broadcast error: " . $e->getMessage());
                }
            }
        }
    }
}
