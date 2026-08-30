<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    use \App\Traits\DataTableTrait;

    public function index(Request $request)
    {
        $query = PaymentTransaction::with(['school', 'installmentPayments.installment']);

        $paginated = $this->applyDataTable($query, $request, [
            'reference_number',
            'payment_method',
            'school.name',
        ], 15);

        return Inertia::render('Admin/Transactions/Index', [
            'transactions' => $paginated,
            'filters' => $request->only(['search']),
        ]);
    }
}
