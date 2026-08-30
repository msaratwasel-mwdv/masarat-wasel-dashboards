<?php

namespace App\Observers;

use App\Events\StudentLocationUpdated;
use App\Models\Student;
use App\Models\SystemEventLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class StudentObserver
{
    public function saved(Student $student): void
    {
        Cache::forget('admin_dashboard_stats');
        $this->notifyBusCrewOnAssignment($student);
    }

    /**
     * Send notifications to the bus crew when a student is assigned to the bus.
     */
    protected function notifyBusCrewOnAssignment(Student $student): void
    {
        $forthBusAssigned = false;
        $backBusAssigned = false;

        if ($student->wasRecentlyCreated) {
            if ($student->forth_bus_id) {
                $forthBusAssigned = true;
            }
            if ($student->back_bus_id) {
                $backBusAssigned = true;
            }
        } else {
            if ($student->wasChanged('forth_bus_id') && $student->forth_bus_id) {
                $forthBusAssigned = true;
            }
            if ($student->wasChanged('back_bus_id') && $student->back_bus_id) {
                $backBusAssigned = true;
            }
        }

        if (! $forthBusAssigned && ! $backBusAssigned) {
            return;
        }

        try {
            $notificationService = app(\App\Services\NotificationService::class);
            $studentName = $student->full_name;
            $studentNameEn = $student->full_name_en ?: $student->student_code;

            if ($forthBusAssigned) {
                $notificationService->notifyBusCrew(
                    busId: $student->forth_bus_id,
                    type: 'student_added_to_route',
                    title: '👤 إضافة طالب جديد',
                    message: "تم إضافة طالب جديد للمسار الصباحي: {$studentName}",
                    data: [
                        'student_id' => (string) $student->id,
                        'category' => 'students',
                        'target_screen' => 'student_details',
                    ],
                    titleEn: '👤 New Student Added',
                    messageEn: "A new student has been added to the morning route: {$studentNameEn}"
                );
            }

            if ($backBusAssigned) {
                $notificationService->notifyBusCrew(
                    busId: $student->back_bus_id,
                    type: 'student_added_to_route',
                    title: '👤 إضافة طالب جديد',
                    message: "تم إضافة طالب جديد لمسار العودة: {$studentName}",
                    data: [
                        'student_id' => (string) $student->id,
                        'category' => 'students',
                        'target_screen' => 'student_details',
                    ],
                    titleEn: '👤 New Student Added',
                    messageEn: "A new student has been added to the return route: {$studentNameEn}"
                );
            }
        } catch (\Exception $e) {
            Log::error('StudentObserver notification failed: '.$e->getMessage());
        }
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

        if (! empty($changed)) {
            $beforeData = [];
            $afterData = [];
            foreach ($changed as $field) {
                $beforeData[$field] = $student->getOriginal($field);
                $afterData[$field] = $student->$field;
            }

            SystemEventLog::create([
                'event_type' => 'student_location_update',
                'entity_type' => 'Student',
                'entity_id' => $student->id,
                'user_id' => Auth::id(),
                'role' => Auth::user()?->role,
                'before_data' => $beforeData,
                'after_data' => $afterData,
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
                    Log::error('StudentObserver broadcast error: '.$e->getMessage());
                }
            }
        }
    }
}
