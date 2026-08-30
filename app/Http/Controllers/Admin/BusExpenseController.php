<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\BusExpense;
use Illuminate\Http\Request;
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
                ->get(),
        ];

        return Inertia::render('Admin/BusExpenses/Index', [
            'expenses' => $expenses,
            'buses' => $buses,
            'filters' => $request->only(['type']),
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bus_id' => 'required|exists:buses,id',
            'type' => 'required|in:fuel,maintenance',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'extra_info' => 'nullable|string|max:500',
            'receipt_photo' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('receipt_photo')) {
            $validated['receipt_photo'] = $request->file('receipt_photo')->store('expenses', 'public');
        }

        BusExpense::create($validated);

        return redirect()->route('admin.bus-expenses.index')
            ->with('success', 'تم إضافة السجل بنجاح');
    }

    public function update(Request $request, BusExpense $bus_expense)
    {
        $validated = $request->validate([
            'bus_id' => 'required|exists:buses,id',
            'type' => 'required|in:fuel,maintenance',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'extra_info' => 'nullable|string|max:500',
            'receipt_photo' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('receipt_photo')) {
            // Delete old photo if exists
            if ($bus_expense->receipt_photo && \Storage::disk('public')->exists($bus_expense->receipt_photo)) {
                \Storage::disk('public')->delete($bus_expense->receipt_photo);
            }
            $validated['receipt_photo'] = $request->file('receipt_photo')->store('expenses', 'public');
        }

        $bus_expense->update($validated);

        return redirect()->route('admin.bus-expenses.index')
            ->with('success', 'تم تعديل السجل بنجاح');
    }

    public function destroy(BusExpense $bus_expense)
    {
        // Delete receipt photo if exists
        if ($bus_expense->receipt_photo && \Storage::disk('public')->exists($bus_expense->receipt_photo)) {
            \Storage::disk('public')->delete($bus_expense->receipt_photo);
        }

        $bus_expense->delete();

        return redirect()->route('admin.bus-expenses.index')
            ->with('success', 'تم حذف السجل بنجاح');
    }
}
