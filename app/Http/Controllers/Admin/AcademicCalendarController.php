<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicCalendar;
use App\Models\School;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AcademicCalendarController extends Controller
{
    public function index()
    {
        $calendars = AcademicCalendar::with('school')->latest()->get();
        $schools = School::select('id', 'name')->get();
        return Inertia::render('Admin/AcademicCalendars/Index', [
            'calendars' => $calendars,
            'schools' => $schools
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => 'required|exists:schools,id',
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'working_days' => 'required|array|min:1',
            'working_days.*' => 'string|in:sunday,monday,tuesday,wednesday,thursday,friday,saturday',
            'is_active' => 'boolean',
        ]);

        if ($request->is_active) {
            AcademicCalendar::where('school_id', $request->school_id)->update(['is_active' => false]);
        }

        AcademicCalendar::create($validated);
        return redirect()->back()->with('success', 'تم إنشاء التقويم الدراسي بنجاح');
    }

    public function update(Request $request, AcademicCalendar $calendar)
    {
        $validated = $request->validate([
            'school_id' => 'required|exists:schools,id',
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'working_days' => 'required|array|min:1',
            'working_days.*' => 'string|in:sunday,monday,tuesday,wednesday,thursday,friday,saturday',
            'is_active' => 'boolean',
        ]);

        if ($request->is_active) {
            AcademicCalendar::where('school_id', $request->school_id)
                ->where('id', '!=', $calendar->id)
                ->update(['is_active' => false]);
        }

        $calendar->update($validated);
        return redirect()->back()->with('success', 'تم تحديث التقويم بنجاح');
    }

    public function destroy(AcademicCalendar $calendar)
    {
        $calendar->delete();
        return redirect()->back()->with('success', 'تم حذف التقويم بنجاح');
    }
}
