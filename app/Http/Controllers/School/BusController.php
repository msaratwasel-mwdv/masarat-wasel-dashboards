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
     * Display the unified bus management interface.
     */
    public function index()
    {
        $schoolId = Auth::user()->school_id;

        // 1. Bus Inventory Data
        $buses = Bus::where('school_id', $schoolId)
            ->with(['driver', 'supervisor'])
            ->withCount(['students' => function ($query) {
                $query->where('bus_students.is_active', true);
            }])
            ->latest()
            ->get()
            ->map(function ($bus) {
                return [
                    'id' => $bus->id,
                    'bus_number' => $bus->bus_number,
                    'plate_number' => $bus->plate_number,
                    'capacity' => $bus->capacity,
                    'type' => $bus->type,
                    'status' => $bus->status,
                    'model' => $bus->model,
                    'year' => $bus->year,
                    'color' => $bus->color,
                    'driver' => $bus->driver,
                    'supervisor' => $bus->supervisor,
                    'students_count' => $bus->students_count,
                    'current_latitude' => (float) $bus->current_latitude,
                    'current_longitude' => (float) $bus->current_longitude,
                    'last_location_update' => $bus->last_location_update,
                    'trip_status' => $bus->trip_status,
                ];
            });

        // 2. Bus Requests Data
        $requests = \App\Models\BusRequest::where('school_id', $schoolId)
            ->latest()
            ->get();

        // 3. School Location for Map Center
        $school = Auth::user()->school;
        $schoolLocation = [
            'lat' => 24.7136, // Default Riyadh
            'lng' => 46.6753,
        ];
        // If school has location, use it (Assuming school model has address_lat/lng or similar)
        // $schoolLocation = ['lat' => $school->lat, 'lng' => $school->lng];

        return Inertia::render('School/Buses/BusesManagement', [
            'buses' => $buses,
            'requests' => $requests,
            'schoolLocation' => $schoolLocation,
        ]);
    }

    /**
     * Store a newly created bus.
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
            'model' => 'nullable|string',
            'year' => 'nullable|integer|min:1990|max:' . (date('Y') + 1),
            'color' => 'nullable|string',
        ]);

        $validated['school_id'] = Auth::user()->school_id;
        $validated['bus_code'] = $validated['bus_number']; // Default code same as number for now

        Bus::create($validated);

        return back()->with('success', 'تم إضافة الحافلة بنجاح');
    }

    /**
     * Update the specified bus.
     */
    public function update(Request $request, Bus $bus)
    {
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
            'model' => 'nullable|string',
            'year' => 'nullable|integer',
            'color' => 'nullable|string',
        ]);

        $bus->update($validated);

        return back()->with('success', 'تم تحديث بيانات الحافلة بنجاح');
    }

    /**
     * Remove the specified bus.
     */
    public function destroy(Bus $bus)
    {
        if ($bus->school_id !== Auth::user()->school_id) {
            abort(403);
        }

        $bus->delete();

        return back()->with('success', 'تم حذف الحافلة بنجاح');
    }

    /**
     * Bulk delete buses.
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:buses,id',
        ]);

        $schoolId = Auth::user()->school_id;
        
        Bus::whereIn('id', $validated['ids'])
           ->where('school_id', $schoolId)
           ->delete();

        return back()->with('success', 'تم حذف الحافلات المحددة بنجاح');
    }

    /**
     * API for Real-time Tracking Data
     */
    public function trackingApi()
    {
        $schoolId = Auth::user()->school_id;
        
        $buses = Bus::where('school_id', $schoolId)
            ->whereNotNull('current_latitude')
            ->whereNotNull('current_longitude')
            ->get()
            ->map(function ($bus) {
                return [
                    'id' => $bus->id,
                    'lat' => (float) $bus->current_latitude,
                    'lng' => (float) $bus->current_longitude,
                    'status' => $bus->trip_status ?? 'idle',
                    'bus_number' => $bus->bus_number,
                    'last_update' => $bus->last_location_update ? $bus->last_location_update->diffForHumans() : null,
                ];
            });

        return response()->json([
            'success' => true,
            'buses' => $buses,
        ]);
    }
}
