<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Plans/Index', [
            'plans' => Plan::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'type' => 'required|in:attendance,transport',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:yearly,monthly,trial',
            'trial_days' => 'nullable|integer|min:0',
            'is_active' => 'boolean'
        ]);

        Plan::create($validated);
        return redirect()->back()->with('success', 'Plan created successfully');
    }

    public function update(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'type' => 'required|in:attendance,transport',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:yearly,monthly,trial',
            'trial_days' => 'nullable|integer|min:0',
            'is_active' => 'boolean'
        ]);

        $plan->update($validated);
        return redirect()->back()->with('success', 'Plan updated successfully');
    }

    public function destroy(Plan $plan)
    {
        $plan->delete();
        return redirect()->back()->with('success', 'Plan deleted successfully');
    }
}
