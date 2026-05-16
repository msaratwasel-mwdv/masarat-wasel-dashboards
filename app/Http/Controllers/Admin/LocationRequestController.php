<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StudentLocationRequest;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class LocationRequestController extends Controller
{
    /**
     * عرض قائمة طلبات تغيير الموقع للمدرسة الحالية
     */
    public function index(Request $request)
    {
        $schoolId = $request->user()->school_id;
        
        $requests = StudentLocationRequest::with(['student.forthBus', 'student.backBus', 'guardian'])
            ->where('school_id', $schoolId)
            ->latest()
            ->paginate(10);

        $buses = \App\Models\Bus::where('school_id', $schoolId)
            ->orderBy('bus_number')
            ->get(['id', 'bus_number', 'plate_number']);

        return Inertia::render('School/Students/LocationRequests', [
            'locationRequests' => $requests,
            'buses' => $buses,
            'stats' => [
                'pending' => StudentLocationRequest::where('school_id', $schoolId)->where('status', 'pending')->count(),
                'approved' => StudentLocationRequest::where('school_id', $schoolId)->where('status', 'approved')->count(),
            ]
        ]);
    }

    /**
     * الموافقة على طلب تغيير الموقع
     */
    public function approve(Request $request, $id)
    {
        $request->validate([
            'forth_bus_id' => 'required|exists:buses,id',
            'back_bus_id'  => 'required|exists:buses,id',
        ]);

        $locationRequest = StudentLocationRequest::findOrFail($id);
        $student = $locationRequest->student;
        
        // 1. تحديث بيانات الطالب - مزامنة كافة حقول الموقع والحافلات
        $student->update([
            'latitude'        => $locationRequest->new_latitude,
            'longitude'       => $locationRequest->new_longitude,
            'forth_latitude'  => $locationRequest->new_latitude,
            'forth_longitude' => $locationRequest->new_longitude,
            'back_latitude'   => $locationRequest->new_latitude,
            'back_longitude'  => $locationRequest->new_longitude,
            'address'         => $locationRequest->new_address,
            'location_note'   => $locationRequest->note,
            'forth_bus_id'    => $request->forth_bus_id,
            'back_bus_id'     => $request->back_bus_id,
        ]);

        // 2. تحديث حالة الطلب
        $locationRequest->update([
            'status'      => 'approved',
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
        ]);

        // 3. إخطار ولي الأمر
        try {
            $notificationService = app(NotificationService::class);
            $notificationService->sendTranslatedToUser(
                userId: $locationRequest->guardian_id,
                type: 'location_approved',
                titleKey: 'notifications.location_approved_title',
                messageKey: 'notifications.location_approved_message',
                translationParams: ['student' => $student->full_name],
                data: [
                    'type' => 'location_approved', 
                    'student_id' => $student->id,
                    'category' => 'requests',
                    'target_screen' => 'location_requests'
                ],
                translationParamsEn: ['student' => $student->full_name_en ?: $student->full_name]
            );
        } catch (\Exception $e) {
            Log::error("❌ Failed to notify guardian about location approval: " . $e->getMessage());
        }

        // 4. إخطار السائقين (باص الذهاب والعودة)
        $this->notifyDrivers($student);

        return back()->with('success', 'تمت الموافقة على الطلب وتحديث بيانات الطالب بنجاح.');
    }

    /**
     * رفض طلب تغيير الموقع
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $locationRequest = StudentLocationRequest::findOrFail($id);
        $student = $locationRequest->student;

        // 1. تحديث حالة الطلب
        $locationRequest->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->rejection_reason,
        ]);

        // 2. إخطار ولي الأمر
        try {
            $notificationService = app(NotificationService::class);
            $notificationService->sendTranslatedToUser(
                userId: $locationRequest->guardian_id,
                type: 'location_rejected',
                titleKey: 'notifications.location_rejected_title',
                messageKey: 'notifications.location_rejected_message',
                translationParams: [
                    'student' => $student->full_name,
                    'reason' => $request->rejection_reason,
                ],
                data: [
                    'type' => 'location_rejected', 
                    'student_id' => $student->id,
                    'category' => 'requests',
                    'target_screen' => 'location_requests'
                ],
                translationParamsEn: [
                    'student' => $student->full_name_en ?: $student->full_name,
                    'reason' => $request->rejection_reason,
                ]
            );
        } catch (\Exception $e) {
            Log::error("❌ Failed to notify guardian about location rejection: " . $e->getMessage());
        }

        return back()->with('success', 'تم رفض الطلب بنجاح.');
    }

    /**
     * إخطار السائقين بتغيير الموقع
     */
    protected function notifyDrivers($student)
    {
        $busIds = array_filter([$student->forth_bus_id, $student->back_bus_id]);
        if (empty($busIds)) return;

        try {
            $notificationService = app(NotificationService::class);
            foreach (array_unique($busIds) as $busId) {
                $bus = \App\Models\Bus::find($busId);
                if ($bus && $bus->driver) {
                    $notificationService->sendTranslatedToUser(
                        userId: $bus->driver->user_id,
                        type: 'address_change',
                        titleKey: 'notifications.address_change_title',
                        messageKey: 'notifications.address_change_message',
                        translationParams: ['student' => $student->full_name],
                        data: [
                            'type' => 'address_change', 
                            'student_id' => $student->id,
                            'category' => 'bus_management',
                            'target_screen' => 'bus_details'
                        ],
                        translationParamsEn: ['student' => $student->full_name_en ?: $student->full_name]
                    );
                }
            }
        } catch (\Exception $e) {
            Log::error("❌ Failed to notify drivers about location change: " . $e->getMessage());
        }
    }
}
