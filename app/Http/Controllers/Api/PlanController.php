<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->hasRole('admin') || $user->hasRole('super_admin')) {
            return response()->json(Plan::all());
        }

        return response()->json(Plan::where('is_active', true)->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'type' => 'required|in:attendance,transport',
            'price' => 'required|numeric',
            'billing_cycle' => 'required|in:yearly,monthly,trial',
            'trial_days' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $plan = Plan::create($validated);

        return response()->json($plan, 201);
    }

    public function update(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'description' => 'nullable|string',
            'type' => 'sometimes|in:attendance,transport',
            'price' => 'sometimes|numeric',
            'billing_cycle' => 'sometimes|in:yearly,monthly,trial',
            'trial_days' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $plan->update($validated);

        return response()->json($plan);
    }

    public function destroy(Plan $plan)
    {
        $plan->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
