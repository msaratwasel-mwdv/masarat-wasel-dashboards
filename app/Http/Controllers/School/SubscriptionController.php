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
            'plans' => Plan::where('is_active', true)->get(),
            'subscriptions' => Subscription::with(['plan', 'student'])
                                ->where('school_id', $schoolId)->get(),
            'students' => Student::where('school_id', $schoolId)->get()
        ]);
    }

    public function subscribeAttendance(Request $request)
    {
        $request->validate(['plan_id' => 'required|exists:plans,id']);
        try {
            $this->subscriptionService->subscribeSchoolToAttendance($request->user()->getSchoolId(), $request->plan_id);
            return redirect()->back()->with('success', 'Subscribed to attendance successfully. Invoice generated pending payment.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    public function subscribeTransport(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id'
        ]);
        try {
            $this->subscriptionService->subscribeStudentsToTransport($request->user()->getSchoolId(), $request->student_ids, $request->plan_id);
            return redirect()->back()->with('success', 'Students subscribed to transport. Invoice generated pending payment.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }
}
