<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\BusGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BusGroupController extends Controller
{
    /**
     * Display a listing of the bus groups.
     */
    public function index()
    {
        $schoolId = Auth::user()->getSchoolId();

        $groups = BusGroup::with(['bus.supervisor'])
            ->where('school_id', $schoolId)
            ->get()
            ->map(function ($group) {
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'bus_id' => $group->bus_id,
                    'bus_number' => $group->bus ? $group->bus->bus_number : null,
                    'supervisor_name' => ($group->bus && $group->bus->supervisor) ? $group->bus->supervisor->name : null,
                    'supervisor_phone' => ($group->bus && $group->bus->supervisor) ? $group->bus->supervisor->phone : null,
                    'morning_students_count' => $group->morningStudents()->count(),
                    'afternoon_students_count' => $group->afternoonStudents()->count(),
                ];
            });

        $buses = Bus::where('school_id', $schoolId)
            ->active()
            ->get(['id', 'bus_number', 'plate_number']);

        return Inertia::render('School/Buses/Groups', [
            'groups' => $groups,
            'buses' => $buses,
        ]);
    }

    /**
     * Store a newly created bus group in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'bus_id' => 'required|exists:buses,id',
        ]);

        $schoolId = Auth::user()->getSchoolId();

        // Ensure bus belongs to the school
        Bus::where('id', $validated['bus_id'])
            ->where('school_id', $schoolId)
            ->firstOrFail();

        BusGroup::create([
            'school_id' => $schoolId,
            'bus_id' => $validated['bus_id'],
            'name' => $validated['name'],
        ]);

        return redirect()->route('school.bus-groups.index')->with('success', 'Bus group created successfully.');
    }

    /**
     * Update the specified bus group in storage.
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'bus_id' => 'required|exists:buses,id',
        ]);

        $schoolId = Auth::user()->getSchoolId();

        $group = BusGroup::where('id', $id)->where('school_id', $schoolId)->firstOrFail();

        // Ensure bus belongs to the school
        Bus::where('id', $validated['bus_id'])
            ->where('school_id', $schoolId)
            ->firstOrFail();

        $group->update($validated);

        return redirect()->route('school.bus-groups.index')->with('success', 'Bus group updated successfully.');
    }

    /**
     * Remove the specified bus group from storage.
     */
    public function destroy($id)
    {
        $schoolId = Auth::user()->getSchoolId();

        $group = BusGroup::where('id', $id)->where('school_id', $schoolId)->firstOrFail();

        // Unset morning/afternoon group IDs for students before deleting
        \App\Models\Student::where('morning_group_id', $group->id)->update(['morning_group_id' => null]);
        \App\Models\Student::where('afternoon_group_id', $group->id)->update(['afternoon_group_id' => null]);

        $group->delete();

        return redirect()->route('school.bus-groups.index')->with('success', 'Bus group deleted successfully.');
    }
}


