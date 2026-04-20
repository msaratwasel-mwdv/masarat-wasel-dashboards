<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\BusExpense;
use App\Models\Bus;
use Inertia\Inertia;

class BusExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = BusExpense::with('bus');

        if ($request->has('type') && in_array($request->type, ['fuel', 'maintenance'])) {
            $query->where('type', $request->type);
        }

        $expenses = $query->latest('date')->paginate(12);
        $buses = Bus::all(['id', 'bus_number', 'plate_number']);

        // Stats for the header
        $stats = [
            'total_fuel' => BusExpense::where('type', 'fuel')->sum('amount'),
            'total_maintenance' => BusExpense::where('type', 'maintenance')->sum('amount'),
            'total_count' => BusExpense::count(),
            'monthly_spending' => BusExpense::whereMonth('date', now()->month)->sum('amount'),
            // Trend data for the chart (grouped by day for the last 15 days)
            'trend' => BusExpense::selectRaw('DATE(date) as date, SUM(amount) as count')
                ->where('date', '>=', now()->subDays(15))
                ->groupBy('date')
                ->orderBy('date')
                ->get()
        ];

        return Inertia::render('Admin/BusExpenses/Index', [
            'expenses' => $expenses,
            'buses' => $buses,
            'filters' => $request->only(['type']),
            'stats' => $stats,
        ]);
    }
}
