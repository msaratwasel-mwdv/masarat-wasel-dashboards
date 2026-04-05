<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\BusRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BusRequestController extends Controller
{
    /**
     * Display a listing of bus requests.
     */
    public function index()
    {
        $schoolId = Auth::user()->school_id;

        $requests = BusRequest::where('school_id', $schoolId)
            ->with('approvedBy')
            ->latest()
            ->get();

        return Inertia::render('School/Buses/BusRequestsList', [
            'requests' => $requests,
        ]);
    }

    /**
     * Store a new bus request.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'request_type' => 'required|in:permanent,temporary',
            'requested_seats' => 'required|integer|min:1',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'nullable|date|after:start_date',
            'reason' => 'required|string|max:1000',
            'special_requirements' => 'nullable|string|max:1000',
        ]);

        $validated['school_id'] = Auth::user()->school_id;
        $validated['status'] = 'pending';

        $busRequest = BusRequest::create($validated);

        return redirect()->back()
            ->with('success', 'تم إرسال طلب الحافلة بنجاح. سيتم مراجعته من قبل إدارة الشركة.');
    }

    /**
     * Update a bus request (only if pending).
     */
    public function update(Request $request, BusRequest $busRequest)
    {
        // Ensure the request belongs to the authenticated user's school
        if ($busRequest->school_id !== Auth::user()->school_id) {
            abort(403);
        }

        // Only allow editing of pending requests
        if ($busRequest->status !== 'pending') {
            return redirect()->back()
                ->with('error', 'لا يمكن تعديل طلب تمت الموافقة عليه أو رفضه');
        }

        $validated = $request->validate([
            'request_type' => 'required|in:permanent,temporary',
            'requested_seats' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'reason' => 'required|string|max:1000',
            'special_requirements' => 'nullable|string|max:1000',
        ]);

        $busRequest->update($validated);

        return redirect()->back()
            ->with('success', 'تم تحديث الطلب بنجاح');
    }

    /**
     * Cancel a bus request (only if pending).
     */
    public function destroy(BusRequest $busRequest)
    {
        // Ensure the request belongs to the authenticated user's school
        if ($busRequest->school_id !== Auth::user()->school_id) {
            abort(403);
        }

        // Only allow cancellation of pending requests
        if ($busRequest->status !== 'pending') {
            return redirect()->back()
                ->with('error', 'لا يمكن إلغاء طلب تمت الموافقة عليه أو رفضه');
        }

        $busRequest->delete();

        return redirect()->back()
            ->with('success', 'تم إلغاء الطلب بنجاح');
    }
}
