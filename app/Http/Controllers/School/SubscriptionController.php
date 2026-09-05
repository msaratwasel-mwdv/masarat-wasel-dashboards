<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    protected $subscriptionService;

    public function __construct(SubscriptionService $subscriptionService)
    {
        $this->subscriptionService = $subscriptionService;
    }

    public function plans(Request $request)
    {
        $schoolId = $request->user()->getSchoolId();

        return Inertia::render('School/Subscriptions/Index', [
            'plans' => Plan::active()->orderBy('sort_order')->get(),
            'billingData' => $this->subscriptionService->getSchoolBillingData($schoolId),
        ]);
    }

    public function transactions(Request $request)
    {
        $schoolId = $request->user()->getSchoolId();

        return Inertia::render('School/Transactions/Index', [
            'billingData' => $this->subscriptionService->getSchoolBillingData($schoolId),
        ]);
    }

    public function uploadReceipt(Request $request, \App\Models\Installment $installment)
    {
        $request->validate([
            'receipt' => 'required|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ]);

        // Ensure this installment belongs to this school
        if ($installment->school_id !== $request->user()->getSchoolId()) {
            abort(403);
        }

        if ($request->hasFile('receipt')) {
            $path = $request->file('receipt')->store('receipts', 'public');
            $installment->update([
                'receipt_path' => $path,
                'verification_status' => 'pending',
                'status' => 'pending', // Still pending financial approval
            ]);
        }

        return redirect()->back()->with('success', 'تم رفع إيصال التحويل بنجاح. سيتم مراجعته من قبل الإدارة.');
    }
}
