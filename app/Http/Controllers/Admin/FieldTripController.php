<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FieldTrip;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FieldTripController extends Controller
{
    /**
     * Display all field trips from all schools.
     */
    public function index()
    {
        $fieldTrips = FieldTrip::with(['school', 'bus.driver'])
            ->withCount(['students', 'internalTeachers'])
            ->latest()
            ->get();

        // Admin needs to see all buses to assign them to trips
        $buses = \App\Models\Bus::with('driver')->get();

        return Inertia::render('Admin/FieldTrips/Index', [
            'fieldTrips' => $fieldTrips,
            'buses' => $buses,
        ]);
    }

    /**
     * Approve a field trip.
     */
    public function approve(Request $request, FieldTrip $fieldTrip)
    {
        $validated = $request->validate([
            'cost' => 'required|numeric|min:0',
            'bus_id' => 'required|exists:buses,id',
        ]);

        $fieldTrip->update([
            'status' => 'approved',
            'approved_by_company' => true,
            'cost' => $validated['cost'],
            'bus_id' => $validated['bus_id'],
        ]);

        $schoolAdmin = \App\Models\User::atSchool($fieldTrip->school_id)
            ->whereHas('roles', fn($q) => $q->where('roles.name', 'school_admin'))
            ->first();

        if ($schoolAdmin) {
            try {
                $notificationService = app(NotificationService::class);
                $notificationService->sendTranslatedToUser(
                    userId: $schoolAdmin->id,
                    type: 'field_trip_approved',
                    titleKey: 'notifications.field_trip_approved_title',
                    messageKey: 'notifications.field_trip_approved_message',
                    translationParams: [
                        'trip' => $fieldTrip->name,
                        'cost' => $fieldTrip->cost
                    ],
                    data: ['trip_id' => $fieldTrip->id, 'category' => 'trips', 'target_screen' => 'trip_details'],
                    translationParamsEn: [
                        'trip' => $fieldTrip->name,
                        'cost' => $fieldTrip->cost
                    ]
                );
            } catch (\Exception $e) {
                // Ignore notification failure
                \Log::error('Failed to send approval notification: ' . $e->getMessage());
            }
        }

        return redirect()->back()->with('success', 'تم الموافقة على الرحلة وتحديد التكلفة والحافلة بنجاح.');
    }

    /**
     * Reject a field trip.
     */
    public function reject(Request $request, FieldTrip $fieldTrip)
    {
        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:1000',
        ]);

        $fieldTrip->update([
            'status' => 'cancelled',
            'approved_by_company' => false,
            'rejection_reason' => $validated['rejection_reason'] ?? null,
        ]);

        $schoolAdmin = \App\Models\User::atSchool($fieldTrip->school_id)
            ->whereHas('roles', fn($q) => $q->where('roles.name', 'school_admin'))
            ->first();

        if ($schoolAdmin) {
            try {
                $notificationService = app(NotificationService::class);
                $messageAddon = ($fieldTrip->rejection_reason) ? " السبب: {$fieldTrip->rejection_reason}" : "";

                $notificationService->sendTranslatedToUser(
                    userId: $schoolAdmin->id,
                    type: 'field_trip_rejected',
                    titleKey: 'notifications.field_trip_rejected_title',
                    messageKey: 'notifications.field_trip_rejected_message',
                    translationParams: [
                        'trip' => $fieldTrip->name,
                        'reason' => $fieldTrip->rejection_reason ?? 'بدون سبب'
                    ],
                    data: ['trip_id' => $fieldTrip->id, 'category' => 'trips', 'target_screen' => 'trip_details'],
                    translationParamsEn: [
                        'trip' => $fieldTrip->name,
                        'reason' => $fieldTrip->rejection_reason ?? 'No reason provided'
                    ]
                );
            } catch (\Exception $e) {
                // Ignore notification failure
                \Log::error('Failed to send rejection notification: ' . $e->getMessage());
            }
        }

        return redirect()->back()->with('success', 'تم إلغاء الرحلة بنجاح.');
    }
    /**
     * Display the specified field trip (JSON for modal).
     */
    public function show(FieldTrip $fieldTrip)
    {
        return response()->json([
            'trip' => $fieldTrip->load(['school', 'students.currentEnrollment.classroom', 'internalTeachers', 'bus.driver', 'bus.assistant'])
        ]);
    }
}



