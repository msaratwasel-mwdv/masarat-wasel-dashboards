<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BusRequestController extends Controller
{
    /**
     * Display all bus requests from all schools.
     */
    public function index()
    {
        $requests = BusRequest::with(['school', 'approvedBy'])
            ->latest()
            ->get();

        return Inertia::render('Admin/BusRequests/Index', [
            'requests' => $requests,
        ]);
    }

    /**
     * Approve a bus request.
     */
    public function approve(BusRequest $busRequest)
    {
        $busRequest->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()
            ->with('success', 'تم الموافقة على الطلب بنجاح');
    }

    /**
     * Reject a bus request.
     */
    public function reject(Request $request, BusRequest $busRequest)
    {
        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $busRequest->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'rejection_reason' => $validated['rejection_reason'] ?? null,
        ]);

        return redirect()->back()
            ->with('success', 'تم رفض الطلب');
    }
}
