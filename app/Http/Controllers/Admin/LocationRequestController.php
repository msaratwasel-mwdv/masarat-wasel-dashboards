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
            $notificationService->sendToUser(
                $locationRequest->guardian_id,
                'location_approved',
                'تمت الموافقة على تغيير الموقع',
                "تمت الموافقة على طلب تغيير موقع منزل الطالب {$student->full_name} وتحديثه في النظام.",
                ['type' => 'location_approved', 'student_id' => $student->id],
                null,
                false,
                'Location Change Approved',
                "The request to change student {$student->full_name_en}'s home location has been approved and updated in the system."
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
            $notificationService->sendToUser(
                $locationRequest->guardian_id,
                'location_rejected',
                'تم رفض طلب تغيير الموقع',
                "تم رفض طلب تغيير موقع منزل الطالب {$student->full_name}. السبب: {$request->rejection_reason}",
                ['type' => 'location_rejected', 'student_id' => $student->id],
                null,
                false,
                'Location Change Request Rejected',
                "The request to change student {$student->full_name_en}'s home location has been rejected. Reason: {$request->rejection_reason}"
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
                    $notificationService->sendToUser(
                        $bus->driver->user_id,
                        'address_change',
                        'تم تحديث موقع طالب',
                        "تم تحديث موقع منزل الطالب {$student->full_name} المرتبط بحافلتك.",
                        ['type' => 'address_change', 'student_id' => $student->id],
                        null,
                        false,
                        'Student Location Updated',
                        "The home location for student {$student->full_name_en} linked to your bus has been updated."
                    );
                }
            }
        } catch (\Exception $e) {
            Log::error("❌ Failed to notify drivers about location change: " . $e->getMessage());
        }
    }
}
