<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    protected $subscriptionService;

    public function __construct(SubscriptionService $subscriptionService)
    {
        $this->subscriptionService = $subscriptionService;
    }

    public function mySubscriptions(Request $request)
    {
        $schoolId = $request->user()->school_id;
        $subscriptions = Subscription::with('plan', 'student')->where('school_id', $schoolId)->get();

        return response()->json($subscriptions);
    }

    public function subscribeAttendance(Request $request)
    {
        $request->validate(['plan_id' => 'required|exists:plans,id']);

        try {
            $result = $this->subscriptionService->subscribeSchoolToAttendance(
                $request->user()->school_id,
                $request->plan_id
            );

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function subscribeTransport(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        try {
            $result = $this->subscriptionService->subscribeStudentsToTransport(
                $request->user()->school_id,
                $request->student_ids,
                $request->plan_id
            );

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
