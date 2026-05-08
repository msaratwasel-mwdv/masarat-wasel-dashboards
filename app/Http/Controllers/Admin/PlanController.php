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
            'plans' => Plan::withCount('subscriptions')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'required|string',
            'price_per_student' => 'required|numeric|min:0',
            'max_buses' => 'nullable|integer|min:1',
            'has_driver_app' => 'boolean',
            'has_parent_app' => 'boolean',
            'has_supervisor_app' => 'boolean',
            'notifications_limit' => 'nullable|string|in:limited,unlimited',
            'has_reports' => 'boolean',
            'has_api_access' => 'boolean',
            'has_dedicated_support' => 'boolean',
            'badge' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        Plan::create($validated);
        return redirect()->back()->with('success', 'تم إضافة الخطة بنجاح');
    }

    public function update(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'required|string',
            'price_per_student' => 'required|numeric|min:0',
            'max_buses' => 'nullable|integer|min:1',
            'has_driver_app' => 'boolean',
            'has_parent_app' => 'boolean',
            'has_supervisor_app' => 'boolean',
            'notifications_limit' => 'nullable|string|in:limited,unlimited',
            'has_reports' => 'boolean',
            'has_api_access' => 'boolean',
            'has_dedicated_support' => 'boolean',
            'badge' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $plan->update($validated);
        return redirect()->back()->with('success', 'تم تحديث الخطة بنجاح');
    }

    public function destroy(Plan $plan)
    {
        $plan->delete();
        return redirect()->back()->with('success', 'تم حذف الخطة بنجاح');
    }

    public function toggle(Plan $plan)
    {
        $plan->update(['is_active' => !$plan->is_active]);
        return redirect()->back()->with('success', 'تم تغيير حالة الخطة بنجاح');
    }
}
