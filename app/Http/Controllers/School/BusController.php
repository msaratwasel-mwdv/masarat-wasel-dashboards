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
        $schoolId = Auth::user()->getSchoolId();

        // 1. Bus Inventory Data
        $buses = Bus::where('school_id', $schoolId)
            ->with(['driver.user', 'fieldSupervisor', 'assistant', 'latestTrip', 'route'])
            ->withStudentsCount()
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
                    'driver' => $bus->driver?->user,
                    'assistant' => $bus->assistant,
                    'field_supervisor' => $bus->fieldSupervisor,
                    'students_count' => $bus->students_count,
                    'latitude' => (float) $bus->latitude,
                    'longitude' => (float) $bus->longitude,
                    'last_location_update' => $bus->last_location_update,
                    'trip_status' => $bus->latestTrip?->status ?? 'idle',
                    'route_id' => $bus->route_id,
                    'route' => $bus->route ? ['id' => $bus->route->id, 'name' => $bus->route->name, 'code' => $bus->route->code] : null,
                ];
            });



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
            'routes' => \App\Models\Route::where('school_id', $schoolId)->orderBy('name')->get(['id', 'name']),
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
            'assistant_id' => 'nullable|exists:users,id',
            'field_supervisor_id' => 'nullable|exists:users,id',
            'model' => 'nullable|string',
            'year' => 'nullable|integer|min:1990|max:' . (date('Y') + 1),
            'color' => 'nullable|string',
            'route_id' => ['nullable', 'integer', Rule::exists('routes', 'id')->where('school_id', Auth::user()->getSchoolId())],
        ]);

        $validated['school_id'] = Auth::user()->getSchoolId();

        // field_supervisor_id and assistant_id already have correct keys for mass assignment
        $driverId = $validated['driver_id'] ?? null;
        if (array_key_exists('driver_id', $validated)) {
            unset($validated['driver_id']);
        }

        $bus = Bus::create($validated);
        
        if ($driverId) {
            \App\Models\Driver::where('user_id', $driverId)->update(['bus_id' => $bus->id]);
        }

        return back()->with('success', 'تم إضافة الحافلة بنجاح');
    }

    /**
     * Update the specified bus.
     */
    public function update(Request $request, Bus $bus)
    {
        if ($bus->school_id !== Auth::user()->getSchoolId()) {
            abort(403);
        }

        $validated = $request->validate([
            'bus_number' => 'required|string|unique:buses,bus_number,' . $bus->id,
            'plate_number' => 'required|string|unique:buses,plate_number,' . $bus->id,
            'capacity' => 'required|integer|min:1',
            'type' => 'required|in:permanent,temporary',
            'status' => 'required|in:active,maintenance,inactive',
            'driver_id' => 'nullable|exists:users,id',
            'assistant_id' => 'nullable|exists:users,id',
            'field_supervisor_id' => 'nullable|exists:users,id',
            'model' => 'nullable|string',
            'year' => 'nullable|integer',
            'color' => 'nullable|string',
            'route_id' => ['nullable', 'integer', Rule::exists('routes', 'id')->where('school_id', Auth::user()->getSchoolId())],
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($bus, $validated) {
            $oldDriverId = $bus->driver?->user_id;
            $newDriverId = $validated['driver_id'] ?? null;
            
            // field_supervisor_id and assistant_id already have correct keys for mass assignment
            if (array_key_exists('driver_id', $validated)) {
                unset($validated['driver_id']);
            }

            $bus->update($validated);

            if ($oldDriverId !== $newDriverId) {
                if ($oldDriverId) {
                    \App\Models\Driver::where('user_id', $oldDriverId)->update(['bus_id' => null]);
                }
                if ($newDriverId) {
                    \App\Models\Driver::where('user_id', $newDriverId)->update(['bus_id' => $bus->id]);
                }
            }
        });

        return back()->with('success', 'تم تحديث بيانات الحافلة بنجاح');
    }

    /**
     * Remove the specified bus.
     */
    public function destroy(Bus $bus)
    {
        if ($bus->school_id !== Auth::user()->getSchoolId()) {
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

        $schoolId = Auth::user()->getSchoolId();

        Bus::whereIn('id', $validated['ids'])
            ->where('school_id', $schoolId)
            ->delete();

        return back()->with('success', 'تم حذف الحافلات المحددة بنجاح');
    }

    /**
     * Show the standalone live tracking page.
     */
    public function liveTracking()
    {
        $schoolId = Auth::user()->getSchoolId();

        $buses = Bus::where('school_id', $schoolId)
            ->with(['driver.user'])
            ->withStudentsCount()
            ->get()
            ->map(function ($bus) {
                return [
                    'id' => $bus->id,
                    'bus_number' => $bus->bus_number,
                    'plate_number' => $bus->plate_number,
                    'capacity' => $bus->capacity,
                    'status' => $bus->status,
                    'current_latitude' => (float) $bus->current_latitude,
                    'current_longitude' => (float) $bus->current_longitude,
                    'trip_status' => $bus->trip_status,
                    'driver' => $bus->driver?->user,
                    'students_count' => $bus->students_count ?? 0,
                ];
            });

        $schoolLocation = [
            'lat' => 24.7136,
            'lng' => 46.6753,
        ];

        return Inertia::render('School/LiveTracking/Index', [
            'buses' => $buses,
            'schoolLocation' => $schoolLocation,
        ]);
    }

    /**
     * API for Real-time Tracking Data
     */
    public function trackingApi()
    {
        $schoolId = Auth::user()->getSchoolId();

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

    /**
     * Show page to assign students to buses (forth/back trip).
     */
    public function assignStudentsPage(Request $request)
    {
        $schoolId = Auth::user()->getSchoolId();

        $buses = Bus::where('school_id', $schoolId)
            ->where('status', 'active')
            ->with(['driver.user', 'assistant', 'route'])
            ->get()
            ->map(fn($bus) => [
                'id'           => $bus->id,
                'bus_number'   => $bus->bus_number,
                'plate_number' => $bus->plate_number,
                'capacity'     => $bus->capacity,
                'route'        => $bus->route ? ['id' => $bus->route->id, 'name' => $bus->route->name] : null,
                'driver'       => $bus->driver?->user?->name,
                'assistant'    => $bus->assistant?->name,
            ]);

        $students = \App\Models\Student::inSchool($schoolId)
            ->where('is_active', true)
            ->orderBy('first_name_ar')
            ->get(['id', 'first_name_ar', 'second_name_ar', 'last_name_ar', 'student_code', 'national_id', 'gender', 'forth_bus_id', 'back_bus_id'])
            ->map(fn($s) => [
                'id'           => $s->id,
                'name'         => $s->full_name,
                'student_code' => $s->student_code,
                'national_id'  => $s->national_id,
                'gender'       => $s->gender,
                'forth_bus_id' => $s->forth_bus_id,
                'back_bus_id'  => $s->back_bus_id,
            ]);

        return Inertia::render('School/Buses/AssignStudents', [
            'buses'         => $buses,
            'students'      => $students,
            'selectedBusId' => $request->query('bus_id'),
        ]);
    }

    /**
     * Save student-to-bus assignments (forth + back trip).
     */
    public function saveAssignedStudents(Request $request)
    {
        $validated = $request->validate([
            'bus_id'            => 'required|exists:buses,id',
            'forth_student_ids' => 'array',
            'forth_student_ids.*' => 'exists:students,id',
            'back_student_ids'  => 'array',
            'back_student_ids.*' => 'exists:students,id',
        ]);

        $busId    = $validated['bus_id'];
        $schoolId = Auth::user()->getSchoolId();

        // Ensure the bus belongs to this school
        Bus::where('id', $busId)->where('school_id', $schoolId)->firstOrFail();

        $forthIds = collect($validated['forth_student_ids'] ?? [])->unique()->values()->all();
        $backIds  = collect($validated['back_student_ids']  ?? [])->unique()->values()->all();

        \Illuminate\Support\Facades\DB::transaction(function () use ($schoolId, $busId, $forthIds, $backIds) {
            // Clear removed forth students
            \App\Models\Student::inSchool($schoolId)
                ->where('forth_bus_id', $busId)
                ->whereNotIn('id', $forthIds)
                ->update(['forth_bus_id' => null]);

            // Clear removed back students
            \App\Models\Student::inSchool($schoolId)
                ->where('back_bus_id', $busId)
                ->whereNotIn('id', $backIds)
                ->update(['back_bus_id' => null]);

            // Assign forth students
            if (!empty($forthIds)) {
                \App\Models\Student::inSchool($schoolId)
                    ->whereIn('id', $forthIds)
                    ->update(['forth_bus_id' => $busId]);
            }

            // Assign back students
            if (!empty($backIds)) {
                \App\Models\Student::inSchool($schoolId)
                    ->whereIn('id', $backIds)
                    ->update(['back_bus_id' => $busId]);
            }
        });

        return redirect()->back()->with('success', 'تم حفظ تعيينات الطلاب بنجاح');
    }
}


