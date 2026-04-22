<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class HolidayController extends Controller
{
    public function index()
    {
        $holidays = Holiday::with(['school', 'creator'])->latest()->get();
        $schools = School::select('id', 'name')->get();
        return Inertia::render('Admin/Holidays/Index', [
            'holidays' => $holidays,
            'schools' => $schools
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => 'nullable|exists:schools,id',
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'type' => 'required|in:official,school_specific,emergency',
            'notes' => 'nullable|string',
        ]);

        $validated['created_by'] = auth()->id();
        
        Holiday::create($validated);
        return redirect()->back()->with('success', 'تم تسجيل العطلة بنجاح');
    }

    public function update(Request $request, Holiday $holiday)
    {
        $validated = $request->validate([
            'school_id' => 'nullable|exists:schools,id',
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'type' => 'required|in:official,school_specific,emergency',
            'notes' => 'nullable|string',
        ]);

        $holiday->update($validated);
        return redirect()->back()->with('success', 'تم تحديث العطلة بنجاح');
    }

    public function destroy(Holiday $holiday)
    {
        $holiday->delete();
        return redirect()->back()->with('success', 'تم حذف العطلة بنجاح');
    }
}
