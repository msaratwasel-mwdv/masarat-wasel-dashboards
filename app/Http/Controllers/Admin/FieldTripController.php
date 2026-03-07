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

        $schoolAdmin = $fieldTrip->school->users()->where('role', 'school_admin')->first();
        
        if ($schoolAdmin) {
            try {
                $notificationService = app(NotificationService::class);
                $notificationService->sendToUser(
                    $schoolAdmin->id,
                    'field_trip_approved',
                    'تمت الموافقة على الرحلة الميدانية ✅',
                    "وافقت الشركة على رحلة: {$fieldTrip->trip_name}. التكلفة المقدرة: {$fieldTrip->cost}",
                    ['trip_id' => $fieldTrip->id],
                    auth()->user()->name
                );
            } catch (\Exception $e) {
                // Ignore notification failure
                \Log::error('Failed to send approval notification: ' . $e->getMessage());
            }
        }
        
        return redirect()->back()->with('success', 'تم الموافقة على الرحلة وتحديد بكر بنجاح.');
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

        $schoolAdmin = $fieldTrip->school->users()->where('role', 'school_admin')->first();
        
        if ($schoolAdmin) {
            try {
                $notificationService = app(NotificationService::class);
                $messageAddon = ($fieldTrip->rejection_reason) ? " السبب: {$fieldTrip->rejection_reason}" : "";
                
                $notificationService->sendToUser(
                    $schoolAdmin->id,
                    'field_trip_rejected',
                    'تم رفض طلب الرحلة الميدانية ❌',
                    "تم رفض طلب رحلة: {$fieldTrip->trip_name} من قبل الإدارة." . $messageAddon,
                    ['trip_id' => $fieldTrip->id],
                    auth()->user()->name
                );
            } catch (\Exception $e) {
                // Ignore notification failure
                \Log::error('Failed to send rejection notification: ' . $e->getMessage());
            }
        }

        return redirect()->back()->with('success', 'تم إلغاء الرحلة بنجاح.');
    }
}
