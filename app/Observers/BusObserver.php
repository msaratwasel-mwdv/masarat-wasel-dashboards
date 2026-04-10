<?php

namespace App\Observers;

use App\Models\Bus;
use App\Models\AssignmentHistory;
use Illuminate\Support\Facades\Auth;

class BusObserver
{
    /**
     * Handle the Bus "updated" event.
     */
    public function updated(Bus $bus)
    {
        $userId = Auth::id(); // المستخدم الحالي (الأدمن)

        // 1. مراقبة تغيير السائق
        if ($bus->isDirty('driver_id')) {
            AssignmentHistory::create([
                'bus_id' => $bus->id,
                'event_type' => 'driver_change',
                'old_driver_id' => $bus->getOriginal('driver_id'),
                'new_driver_id' => $bus->driver_id,
                'changed_by' => $userId,
            ]);
        }

        if ($bus->isDirty('supervisor_id')) {
            AssignmentHistory::create([
                'bus_id' => $bus->id,
                'event_type' => 'supervisor_change',
                'old_supervisor_id' => $bus->getOriginal('supervisor_id'),
                'new_supervisor_id' => $bus->supervisor_id,
                'changed_by' => $userId,
            ]);
        }

        // 3. مراقبة تغيير المدرسة (دخول أو خروج)
        if ($bus->isDirty('school_id')) {
            // إذا كان new_school_id = null، فهذا يعني "خروج من المدرسة"
            AssignmentHistory::create([
                'bus_id' => $bus->id,
                'event_type' => 'school_change',
                'old_school_id' => $bus->getOriginal('school_id'),
                'new_school_id' => $bus->school_id,
                'changed_by' => $userId,
            ]);
        }

        // 4. ✅ (جديد) مراقبة تغيير الحالة (صيانة، نشط، إلخ)
        if ($bus->isDirty('status')) {
            AssignmentHistory::create([
                'bus_id' => $bus->id,
                'event_type' => 'status_change',
                'old_status' => $bus->getOriginal('status'),
                'new_status' => $bus->status,
                'notes' => $bus->deactivation_reason, // إذا تغيرت الحالة بسبب أرشفة
                'changed_by' => $userId,
            ]);
        }
    }

    /**
     * Handle the Bus "deleted" event (Archived).
     * يتم استدعاؤها عند عمل Soft Delete
     */
    public function deleted(Bus $bus)
    {
        AssignmentHistory::create([
            'bus_id' => $bus->id,
            'event_type' => 'bus_archived',
            'old_status' => $bus->status,
            'new_status' => 'archived',
            'notes' => $bus->deactivation_reason ?? 'Archived by admin',
            'changed_by' => Auth::id(),
        ]);
    }

    /**
     * Handle the Bus "restored" event.
     * في حال قمت باستعادة الباص من الأرشيف
     */
    public function restored(Bus $bus)
    {
        AssignmentHistory::create([
            'bus_id' => $bus->id,
            'event_type' => 'bus_restored',
            'new_status' => 'active',
            'changed_by' => Auth::id(),
        ]);
    }
}


