<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmergencyController extends Controller
{
    /**
     * Display the live emergency monitor dashboard.
     */
    public function index()
    {
        // Get active and in_progress incidents
        $activeIncidents = Incident::with(['reporter', 'bus.driver', 'bus.supervisor'])
            ->whereIn('status', ['active', 'in_progress'])
            ->latest()
            ->get();

        // Get recent resolved incidents (last 24 hours) for context
        $resolvedIncidents = Incident::with(['reporter', 'bus', 'resolver'])
            ->where('status', 'resolved')
            ->where('updated_at', '>=', now()->subDay())
            ->latest()
            ->get();

        return Inertia::render('Admin/Reports/EmergencyMonitor', [
            'activeIncidents' => $activeIncidents,
            'resolvedIncidents' => $resolvedIncidents,
        ]);
    }

    /**
     * Update incident status (e.g. mark as resolved)
     */
    public function updateStatus(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,in_progress,resolved',
        ]);

        $updateData = ['status' => $validated['status']];

        if ($validated['status'] === 'resolved') {
            $updateData['resolved_by'] = $request->user()->id;
        }

        $incident->update($updateData);

        return redirect()->back()->with('success', 'تم تحديث حالة البلاغ بنجاح');
    }
}
