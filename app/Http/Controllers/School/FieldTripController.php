<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\FieldTrip;
use App\Models\FieldTripParticipant;
use App\Models\Bus;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FieldTripController extends Controller
{
    public function index()
    {
        $schoolId = Auth::user()->school_id;

        $fieldTrips = FieldTrip::where('school_id', $schoolId)
            ->with(['bus.driver', 'bus.supervisor'])
            ->latest('trip_date')
            ->get()
            ->map(function ($trip) {
                // Compatibility mapping for frontend
                $trip->buses = $trip->bus ? [$trip->bus] : [];
                $trip->teachers = $trip->teacher_names ?? [];
                
                return $trip;
            });

        $buses = Bus::where('school_id', $schoolId)
            ->where('status', 'active')
            ->with(['driver', 'supervisor'])
            ->get();

        // Fetch Supervisors
        $supervisors = User::where('school_id', $schoolId)
            ->where('role', 'supervisor')
            ->select('id', 'name')
            ->get();

        // Fetch Drivers (for future use or if needed now)
        $drivers = User::where('school_id', $schoolId)
            ->where('role', 'driver')
            ->select('id', 'name')
            ->get();

        // Fetch Teachers for the Field Trip Members Selection
        $teachers = User::where('school_id', $schoolId)
            ->where('role', 'teacher')
            ->select('id', 'name', 'phone')
            ->get();

        return Inertia::render('School/FieldTrips/Index', [
            'fieldTrips' => $fieldTrips,
            'buses' => $buses,
            'supervisors' => $supervisors,
            'drivers' => $drivers,
            'teachers' => $teachers,
        ]);
    }

    /**
     * Store a new field trip.
     */
    public function store(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('FieldTripController@store BEGIN', [
            'request_all' => $request->all(),
            'user_id' => Auth::id(),
            'school_id' => Auth::user()->school_id ?? 'NULL'
        ]);

        try {
            $validated = $request->validate([
                'trip_name' => 'required|string|max:255',
                'description' => 'required|string|max:1000',
                'trip_date' => 'required|date',
                'trip_time' => 'required',
                'destination' => 'required|string|max:255',
                'destination_lat' => 'required|numeric',
                'destination_lng' => 'required|numeric',
                'number_of_students' => 'required|integer|min:1',
                'teacher_names' => 'nullable|array',
                'teacher_names.*.type' => 'required|in:teacher,external',
                'teacher_names.*.id' => 'required_if:teacher_names.*.type,teacher',
                'teacher_names.*.name' => 'required|string|max:255',
                'teacher_names.*.phone' => 'required_if:teacher_names.*.type,external|nullable|string|max:20',
                'teacher_names.*.national_id' => 'required_if:teacher_names.*.type,external|nullable|string|max:50',
            ]);
            \Illuminate\Support\Facades\Log::info('FieldTrip Validation PASSED', $validated);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('FieldTrip Validation FAILED', [
                'errors' => $e->errors(),
                'data' => $request->all()
            ]);
            throw $e;
        }

        DB::beginTransaction();
        try {
            $data = [
                'school_id' => Auth::user()->school_id,
                'trip_name' => $validated['trip_name'],
                'description' => $validated['description'],
                'trip_date' => $validated['trip_date'],
                'trip_time' => $validated['trip_time'],
                'destination' => $validated['destination'],
                'destination_lat' => $validated['destination_lat'],
                'destination_lng' => $validated['destination_lng'],
                'number_of_students' => $validated['number_of_students'],
                'status' => 'planned',
                'approved_by_school' => true,
                'approved_by_company' => false,
                'teacher_names' => $validated['teacher_names'] ?? [],
            ];
            
            \Illuminate\Support\Facades\Log::info('Attempting FieldTrip::create', $data);
            
            $fieldTrip = FieldTrip::create($data);

            \Illuminate\Support\Facades\Log::info('FieldTrip created SUCCESS', ['id' => $fieldTrip->id]);

            // Note: Teacher names are stored as JSON in the field_trips table
            // In the new logic, buses/drivers are assigned by the company admin later.

            // إرسال إشعار للمشرفين الإداريين (اختياري)
            try {
                $notificationService = app(\App\Services\NotificationService::class);
                $notificationService->notifyCompanyAdmins(
                    'field_trip_request',
                    '🆕 طلب رحلة ميدانية جديد',
                    'قامت مدرسة ' . Auth::user()->school->name . ' بتقديم طلب لرحلة: ' . $fieldTrip->trip_name,
                    ['trip_id' => $fieldTrip->id]
                );
                \Illuminate\Support\Facades\Log::info('Notification sent to admins');
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Notification failed but trip created', ['error' => $e->getMessage()]);
            }

            DB::commit();
            \Illuminate\Support\Facades\Log::info('Transaction COMMITTED');

            return redirect()->route('school.field-trips.index')
                ->with('success', 'تم تقديم طلب الرحلة الميدانية بنجاح. في انتظار مراجعة وتحديد التكلفة من إدارة الشركة.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('FieldTrip storage EXCEPTION', [
                'msg' => $e->getMessage(),
                'trace' => substr($e->getTraceAsString(), 0, 500)
            ]);
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'حدث خطأ أثناء إنشاء الرحلة: ' . $e->getMessage());
        }
    }

    /**
     * Update field trip status or details.
     */
    public function update(Request $request, FieldTrip $fieldTrip)
    {
        // Ensure the trip belongs to the authenticated user's school
        if ($fieldTrip->school_id !== Auth::user()->school_id) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => 'sometimes|in:planned,approved,in_progress,completed,cancelled',
            'approved_by_school' => 'sometimes|boolean',
        ]);

        $fieldTrip->update($validated);

        // Send notifications if approved
        if (isset($validated['approved_by_school']) && $validated['approved_by_school']) {
            $notificationService = app(NotificationService::class);
            $schoolName = Auth::user()->school->name ?? 'المدرسة';
            
            // Notify participants
            $driverIds = $fieldTrip->participants()->where('participant_type', 'driver')->pluck('participant_id')->toArray();
            $supervisorIds = $fieldTrip->participants()->where('participant_type', 'supervisor')->pluck('participant_id')->toArray();
            
            $allParticipants = array_merge($driverIds, $supervisorIds);
            
            if (!empty($allParticipants)) {
                $notificationService->sendToUsers(
                    $allParticipants,
                    'field_trip_approved',
                    'تمت الموافقة على الرحلة',
                    "وافقت المدرسة على الرحلة الميدانية: {$fieldTrip->trip_name}",
                    ['trip_id' => $fieldTrip->id],
                    $schoolName
                );
            }
        }

        return redirect()->back()
            ->with('success', 'تم تحديث بيانات الرحلة بنجاح');
    }

    /**
     * Delete a field trip (only if not started).
     */
    public function destroy(FieldTrip $fieldTrip)
    {
        // Ensure the trip belongs to the authenticated user's school
        if ($fieldTrip->school_id !== Auth::user()->school_id) {
            abort(403);
        }

        // Only allow deletion of planned trips
        if (in_array($fieldTrip->status, ['in_progress', 'completed'])) {
            return redirect()->back()
                ->with('error', 'لا يمكن حذف رحلة جارية أو مكتملة');
        }

        $fieldTrip->delete();

        return redirect()->back()
            ->with('success', 'تم حذف الرحلة بنجاح');
    }
}
