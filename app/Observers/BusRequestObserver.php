<?php

namespace App\Observers;

use App\Models\BusRequest;
use App\Models\Notification;
use App\Models\User;

class BusRequestObserver
{
    /**
     * Handle the BusRequest "created" event.
     */
    public function created(BusRequest $busRequest): void
    {
        // Get all admin users
        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            Notification::create([
                'type' => 'bus_request',
                'title' => 'طلب حافلة جديد',
                'message' => "طلب حافلة {$busRequest->request_type} من {$busRequest->school->name}",
                'data' => [
                    'bus_request_id' => $busRequest->id,
                    'school_id' => $busRequest->school_id,
                    'school_name' => $busRequest->school->name,
                    'request_type' => $busRequest->request_type,
                    'number_of_buses' => $busRequest->number_of_buses,
                    'start_date' => $busRequest->start_date,
                ],
                'user_id' => $admin->id,
                'from_user_name' => $busRequest->school->name,
                'status' => 'unread',
                'icon' => 'bus',
                'color' => 'blue',
            ]);
        }
    }

    /**
     * Handle the BusRequest "updated" event.
     */
    public function updated(BusRequest $busRequest): void
    {
        // If status changed to approved/rejected, notify the school
        if ($busRequest->isDirty('status') && in_array($busRequest->status, ['approved', 'rejected'])) {
            $schoolAdmins = User::where('school_id', $busRequest->school_id)
                ->where('role', 'school_admin')
                ->get();

            $statusText = $busRequest->status === 'approved' ? 'تم الموافقة' : 'تم الرفض';
            $color = $busRequest->status === 'approved' ? 'green' : 'red';

            foreach ($schoolAdmins as $schoolAdmin) {
                Notification::create([
                    'type' => 'bus_request_status',
                    'title' => 'تحديث حالة طلب الحافلة',
                    'message' => "{$statusText} على طلب الحافلة #{$busRequest->id}",
                    'data' => [
                        'bus_request_id' => $busRequest->id,
                        'status' => $busRequest->status,
                        'request_type' => $busRequest->request_type,
                        'number_of_buses' => $busRequest->number_of_buses,
                    ],
                    'user_id' => $schoolAdmin->id,
                    'from_user_name' => 'الإدارة',
                    'status' => 'unread',
                    'icon' => $busRequest->status === 'approved' ? 'check-circle' : 'x-circle',
                    'color' => $color,
                ]);
            }
        }
    }
}
