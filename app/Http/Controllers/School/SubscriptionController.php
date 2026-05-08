<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Student;
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
}
