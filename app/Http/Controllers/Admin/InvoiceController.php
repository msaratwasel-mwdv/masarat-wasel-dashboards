<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function index()
    {
        $invoices = Invoice::with(['school', 'transactions', 'items.subscription.plan'])->latest('due_date')->get();
        return Inertia::render('Admin/Invoices/Index', [
            'invoices' => $invoices
        ]);
    }

    public function logPayment(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.1',
            'payment_method' => 'required|string',
            'reference_number' => 'nullable|string'
        ]);

        Transaction::create([
            'invoice_id' => $invoice->id,
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'reference_number' => $validated['reference_number'],
            'payment_date' => now()
        ]);

        $totalPaid = $invoice->transactions()->sum('amount');
        if ($totalPaid >= $invoice->total_amount) {
            $invoice->update(['status' => 'paid']);
            // Activate pending subscriptions
            $invoice->items()->each(function($item) {
                if ($item->subscription && $item->subscription->status == 'pending_payment') {
                    $item->subscription->update(['status' => 'active']);
                }
            });
        } elseif ($totalPaid > 0) {
            $invoice->update(['status' => 'partially_paid']);
        }

        return redirect()->back()->with('success', 'Payment logged successfully');
    }
}
