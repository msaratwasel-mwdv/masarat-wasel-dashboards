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
            ->with('participants')
            ->latest('trip_date')
            ->get()
            ->map(function ($trip) {
                // Format data for frontend
                $participants = $trip->participants;
                
                // Get buses
                $busParticipants = $participants->where('participant_type', 'App\\Models\\Bus');
                $trip->buses = $busParticipants->map(function($p) {
                    return $p->participant;
                })->filter()->values();
                
                // Get teachers (simplified - can be expanded later)
                $trip->teachers = ['معلم 1', 'معلم 2']; // TODO: Implement teachers properly
                
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

        return Inertia::render('School/FieldTrips/Index', [
            'fieldTrips' => $fieldTrips,
            'buses' => $buses,
            'supervisors' => $supervisors,
            'drivers' => $drivers,
        ]);
    }

    /**
     * Store a new field trip.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'trip_name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'trip_date' => 'required|date|after_or_equal:today',
            'trip_time' => 'required|date_format:H:i',
            'destination' => 'required|string|max:255',
            'destination_lat' => 'nullable|numeric|between:-90,90',
            'destination_lng' => 'nullable|numeric|between:-180,180',
            'number_of_students' => 'required|integer|min:1',
            'bus_ids' => 'required|array|min:1',
            'bus_ids.*' => 'exists:buses,id',
            'driver_ids' => 'nullable|array',
            'driver_ids.*' => 'exists:users,id',
            'supervisor_ids' => 'nullable|array',
            'supervisor_ids.*' => 'exists:users,id',
            'teacher_names' => 'nullable|array',
            'teacher_names.*' => 'string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $fieldTrip = FieldTrip::create([
                'school_id' => Auth::user()->school_id,
                'trip_name' => $validated['trip_name'],
                'description' => $validated['description'],
                'trip_date' => $validated['trip_date'],
                'trip_time' => $validated['trip_time'],
                'destination' => $validated['destination'],
                'destination_lat' => $validated['destination_lat'] ?? null,
                'destination_lng' => $validated['destination_lng'] ?? null,
                'number_of_students' => $validated['number_of_students'],
                'status' => 'planned',
                'approved_by_school' => false,
                'approved_by_company' => false,
                'teacher_names' => $validated['teacher_names'] ?? [],
            ]);

            // Add bus participants
            foreach ($validated['bus_ids'] as $busId) {
                FieldTripParticipant::create([
                    'field_trip_id' => $fieldTrip->id,
                    'participant_type' => 'bus',
                    'participant_id' => $busId,
                ]);
            }

            // Add driver participants
            if (!empty($validated['driver_ids'])) {
                foreach ($validated['driver_ids'] as $driverId) {
                    FieldTripParticipant::create([
                        'field_trip_id' => $fieldTrip->id,
                        'participant_type' => 'driver',
                        'participant_id' => $driverId,
                    ]);
                }
            }

            // Add supervisor participants
            if (!empty($validated['supervisor_ids'])) {
                foreach ($validated['supervisor_ids'] as $supervisorId) {
                    FieldTripParticipant::create([
                        'field_trip_id' => $fieldTrip->id,
                        'participant_type' => 'supervisor',
                        'participant_id' => $supervisorId,
                    ]);
                }
            }

            // Note: Teacher names are stored differently as they might not be users in the system
            // They could be stored as JSON in the field_trips table or in a separate table
            // For now, we'll handle them in the frontend

            // Send notifications
            $notificationService = app(NotificationService::class);
            $schoolName = Auth::user()->school->name ?? 'المدرسة';

            // Notify drivers
            if (!empty($validated['driver_ids'])) {
                $notificationService->sendToUsers(
                    $validated['driver_ids'],
                    'field_trip_assigned',
                    'رحلة ميدانية جديدة',
                    "تم تعيينك سائقًا لرحلة ميدانية جديدة: {$fieldTrip->trip_name}",
                    ['trip_id' => $fieldTrip->id],
                    $schoolName
                );
            }

            // Notify supervisors
            if (!empty($validated['supervisor_ids'])) {
                $notificationService->sendToUsers(
                    $validated['supervisor_ids'],
                    'field_trip_assigned',
                    'رحلة ميدانية جديدة',
                    "تم تعيينك مشرفًا لرحلة ميدانية جديدة: {$fieldTrip->trip_name}",
                    ['trip_id' => $fieldTrip->id],
                    $schoolName
                );
            }

            // Notify company admins (same as bus request pattern)
            $notificationService->notifyCompanyAdmins(
                'field_trip_request',
                'طلب رحلة ميدانية جديدة',
                "تم تقديم طلب رحلة ميدانية من مدرسة {$schoolName}: {$fieldTrip->trip_name} - بتاريخ {$fieldTrip->trip_date}",
                [
                    'trip_id' => $fieldTrip->id,
                    'school_id' => $fieldTrip->school_id,
                    'trip_name' => $fieldTrip->trip_name,
                    'trip_date' => $fieldTrip->trip_date,
                ],
                $schoolName
            );

            // Notify company manager (simulated by finding users with company roles or specific logic)
            // For now, assuming company admins are notified via another channel or system notification
            // but we can send to school manager confirming creation

            DB::commit();

            return redirect()->back()
                ->with('success', 'تم إنشاء الرحلة الميدانية بنجاح. في انتظار الموافقة من إدارة الشركة.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'حدث خطأ أثناء إنشاء الرحلة. يرجى المحاولة مرة أخرى.');
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
