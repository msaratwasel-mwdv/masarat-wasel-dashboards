<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index()
    {
        $transactions = PaymentTransaction::with(['school', 'installmentPayments.installment'])
            ->latest()
            ->paginate(15);

        return Inertia::render('Admin/Transactions/Index', [
            'transactions' => $transactions
        ]);
    }
}
