<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BusController extends Controller
{
    /**
     * Display a listing of buses.
     */
    public function index()
    {
        $schoolId = Auth::user()->school_id;

        // TODO: Replace with actual database query when backend is ready
        // For now, this will return empty array, frontend will use MockBusData.ts
        $buses = Bus::where('school_id', $schoolId)
            ->with(['driver', 'supervisor'])
            ->get();

        return Inertia::render('School/Buses/Index', [
            'buses' => $buses,
        ]);
    }

    /**
     * Store a newly created bus.
     * Currently returns success message only (mock).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'bus_number' => 'required|string|unique:buses',
            'plate_number' => 'required|string|unique:buses',
            'capacity' => 'required|integer|min:1',
            'type' => 'required|in:permanent,temporary',
            'status' => 'required|in:active,maintenance,inactive',
            'driver_id' => 'nullable|exists:users,id',
            'supervisor_id' => 'nullable|exists:users,id',
        ]);

        $validated['school_id'] = Auth::user()->school_id;

        $bus = Bus::create($validated);

        return redirect()->route('school.buses.index')
            ->with('success', 'تم إضافة الحافلة بنجاح');
    }

    /**
     * Update the specified bus.
     */
    public function update(Request $request, Bus $bus)
    {
        // Ensure the bus belongs to the authenticated user's school
        if ($bus->school_id !== Auth::user()->school_id) {
            abort(403);
        }

        $validated = $request->validate([
            'bus_number' => 'required|string|unique:buses,bus_number,' . $bus->id,
            'plate_number' => 'required|string|unique:buses,plate_number,' . $bus->id,
            'capacity' => 'required|integer|min:1',
            'type' => 'required|in:permanent,temporary',
            'status' => 'required|in:active,maintenance,inactive',
            'driver_id' => 'nullable|exists:users,id',
            'supervisor_id' => 'nullable|exists:users,id',
        ]);

        $bus->update($validated);

        return redirect()->route('school.buses.index')
            ->with('success', 'تم تحديث بيانات الحافلة بنجاح');
    }

    /**
     * Remove the specified bus.
     */
    public function destroy(Bus $bus)
    {
        // Ensure the bus belongs to the authenticated user's school
        if ($bus->school_id !== Auth::user()->school_id) {
            abort(403);
        }

        $bus->delete();

        return redirect()->route('school.buses.index')
            ->with('success', 'تم حذف الحافلة بنجاح');
    }
}
