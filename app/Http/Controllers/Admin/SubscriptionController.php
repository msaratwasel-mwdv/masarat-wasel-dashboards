<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
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

    public function index()
    {
        $subscriptions = Subscription::with(['school.users', 'plan'])
            ->latest()
            ->get();

        return Inertia::render('Admin/Subscriptions/Index', [
            'subscriptions' => $subscriptions,
            'all_plans' => \App\Models\Plan::where('is_active', true)->get()
        ]);
    }

    public function installmentsList(Request $request)
    {
        $installments = \App\Models\Installment::with(['school', 'subscription.plan', 'installmentPayments.paymentTransaction'])
            ->latest('due_date')
            ->get();

        $initialSearch = '';
        if ($request->has('school_id')) {
            $school = \App\Models\School::find($request->school_id);
            if ($school) {
                $initialSearch = $school->name;
            }
        }

        $schools = \App\Models\School::whereHas('installments', function($q) {
                $q->whereIn('status', ['pending', 'partially_paid', 'overdue']);
            })
            ->with(['installments' => function($q) {
                $q->whereIn('status', ['pending', 'partially_paid', 'overdue'])->orderBy('due_date');
            }])
            ->get()
            ->map(function($school) {
                return [
                    'id' => $school->id,
                    'name' => $school->name,
                    'total_due' => $school->installments->sum('remaining_amount'),
                    'oldest_installment' => $school->installments->first() ? [
                        'id' => $school->installments->first()->id,
                        'amount' => $school->installments->first()->amount,
                        'paid_amount' => $school->installments->first()->paid_amount,
                        'installment_number' => $school->installments->first()->installment_number
                    ] : null,
                ];
            });

        return Inertia::render('Admin/Installments/Index', [
            'installments' => $installments,
            'initialSearch' => $initialSearch,
            'schools' => $schools
        ]);
    }

    public function approve(Request $request, Subscription $subscription)
    {
        $validated = $request->validate([
            'installments_count' => 'required|integer|min:1|max:24'
        ]);

        try {
            $this->subscriptionService->approveSubscription($subscription->id, $validated['installments_count']);
            return redirect()->back()->with('success', 'تم الموافقة على الاشتراك وإنشاء الدفعات بنجاح');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    public function reject(Subscription $subscription)
    {
        try {
            $this->subscriptionService->rejectSubscription($subscription->id);
            return redirect()->back()->with('success', 'تم رفض الاشتراك بنجاح');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    public function showInstallments(Subscription $subscription)
    {
        $billing = $this->subscriptionService->getSchoolBillingData($subscription->school_id);

        return Inertia::render('Admin/Subscriptions/Installments', [
            'subscription' => $subscription->load(['school', 'plan']),
            'installments' => $billing['installments'],
            'summary' => [
                'total_owed' => $billing['total_owed'],
                'total_paid' => $billing['total_paid'],
            ]
        ]);
    }

    public function payInstallment(Request $request, \App\Models\Installment $installment)
    {
        $validated = $request->validate([
            'payment_method' => 'required|string',
            'amount' => 'required|numeric|min:0.01',
            'reference_number' => 'nullable|string'
        ]);

        try {
            $this->subscriptionService->payInstallment($installment->id, $validated['amount'], $validated['payment_method'], $validated['reference_number']);
            return redirect()->back()->with('success', 'تم تسجيل الدفعة بنجاح');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }
}
