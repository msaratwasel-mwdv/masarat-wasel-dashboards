<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Inertia\Inertia;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $request->user()->getSchoolId();
        $invoices = Invoice::with(['items.subscription.plan', 'transactions'])
            ->where('school_id', $schoolId)
            ->latest('due_date')
            ->get();

        return Inertia::render('School/Invoices/Index', [
            'invoices' => $invoices
        ]);
    }
}
