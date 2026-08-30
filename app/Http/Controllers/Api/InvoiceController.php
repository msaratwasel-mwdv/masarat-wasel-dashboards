<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    protected $subscriptionService;

    public function __construct(SubscriptionService $subscriptionService)
    {
        $this->subscriptionService = $subscriptionService;
    }

    /**
     * Get invoices (installments) for the current user's school.
     */
    public function myInvoices(Request $request): JsonResponse
    {
        $schoolId = $request->user()->school_id;
        if (! $schoolId) {
            $schoolId = $request->user()->getSchoolIdEfficient();
        }

        if (! $schoolId) {
            return response()->json([
                'success' => false,
                'message' => 'School association not found.',
            ], 403);
        }

        $installments = Installment::with(['school', 'subscription.plan', 'installmentPayments'])
            ->where('school_id', $schoolId)
            ->get();

        return response()->json($installments);
    }

    /**
     * Get all invoices (installments) across all schools.
     */
    public function allInvoices(): JsonResponse
    {
        $installments = Installment::with(['school', 'subscription.plan', 'installmentPayments'])->get();

        return response()->json($installments);
    }

    /**
     * Log a payment for an invoice (installment).
     */
    public function logPayment(Request $request, $installmentId): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.1',
            'payment_method' => 'required|string',
            'reference_number' => 'nullable|string',
        ]);

        try {
            $this->subscriptionService->payInstallment(
                (int) $installmentId,
                (float) $validated['amount'],
                $validated['payment_method'],
                $validated['reference_number']
            );

            $installment = Installment::with(['school', 'subscription.plan', 'installmentPayments'])->findOrFail($installmentId);

            return response()->json([
                'success' => true,
                'message' => 'Payment logged successfully',
                'invoice' => $installment,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
