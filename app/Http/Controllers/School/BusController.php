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
            ->with(['drivers.user', 'fieldSupervisor'])
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
                    'driver' => $bus->drivers->count() > 0 ? $bus->drivers->first()->user : null,
                    'supervisor' => $bus->fieldSupervisor,
                    'students_count' => $bus->students_count,
                    'current_latitude' => (float) $bus->current_latitude,
                    'current_longitude' => (float) $bus->current_longitude,
                    'last_location_update' => $bus->last_location_update,
                    'trip_status' => $bus->trip_status,
                    'route_id' => $bus->route_id,
                ];
            });

        // 2. Bus Requests Data (BusRequest is deprecated)
        $requests = collect([]);

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
            'supervisor_id' => 'nullable|exists:users,id',
            'model' => 'nullable|string',
            'year' => 'nullable|integer|min:1990|max:' . (date('Y') + 1),
            'color' => 'nullable|string',
            'route_id' => ['nullable', 'integer', Rule::exists('routes', 'id')->where('school_id', Auth::user()->getSchoolId())],
        ]);

        $validated['school_id'] = Auth::user()->getSchoolId();

        if (isset($validated['supervisor_id'])) {
            $validated['field_supervisor_id'] = $validated['supervisor_id'];
            unset($validated['supervisor_id']);
        }
        $driverId = $validated['driver_id'] ?? null;
        if (array_key_exists('driver_id', $validated)) {
            unset($validated['driver_id']);
        }

        $bus = Bus::create($validated);
        
        if ($driverId) {
            \App\Models\Driver::where('user_id', $driverId)->update(['bus_id' => $bus->id, 'school_id' => $validated['school_id']]);
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
            'supervisor_id' => 'nullable|exists:users,id',
            'model' => 'nullable|string',
            'year' => 'nullable|integer',
            'color' => 'nullable|string',
            'route_id' => ['nullable', 'integer', Rule::exists('routes', 'id')->where('school_id', Auth::user()->getSchoolId())],
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($bus, $validated) {
            $oldDriverId = $bus->drivers->first()->user_id ?? null;
            $newDriverId = $validated['driver_id'] ?? null;
            
            if (isset($validated['supervisor_id'])) {
                $validated['field_supervisor_id'] = $validated['supervisor_id'];
                unset($validated['supervisor_id']);
            }
            if (array_key_exists('driver_id', $validated)) {
                unset($validated['driver_id']);
            }

            $bus->update($validated);

            if ($oldDriverId !== $newDriverId) {
                if ($oldDriverId) {
                    \App\Models\Driver::where('user_id', $oldDriverId)->update(['bus_id' => null, 'school_id' => null]);
                }
                if ($newDriverId) {
                    \App\Models\Driver::where('user_id', $newDriverId)->update(['bus_id' => $bus->id, 'school_id' => $bus->school_id]);
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
            ->with(['drivers.user'])
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
                    'driver' => $bus->drivers->count() > 0 ? $bus->drivers->first()->user : null,
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
     * Show the generic page to assign students to buses.
     */
    public function assignStudentsPage(Request $request)
    {
        $schoolId = Auth::user()->getSchoolId();

        // Fetch all bus groups
        $groups = \App\Models\BusGroup::with('bus')->where('school_id', $schoolId)->get();

        // Fetch all active students in the school
        $students = \App\Models\Student::inSchool($schoolId)
            ->where('is_active', true)
            ->orderBy('first_name_ar') 
            ->get(['id', 'first_name_ar', 'last_name_ar', 'student_code', 'national_id', 'gender', 'morning_group_id', 'afternoon_group_id'])
            ->map(function ($student) {
                return [
                    'id' => $student->id,
                    'name' => $student->full_name,
                    'student_code' => $student->student_code,
                    'national_id' => $student->national_id,
                    'gender' => $student->gender,
                    'morning_group_id' => $student->morning_group_id,
                    'afternoon_group_id' => $student->afternoon_group_id,
                ];
            });

        return Inertia::render('School/Buses/AssignStudents', [
            'groups' => $groups,
            'students' => $students,
            'selectedGroupId' => $request->query('group_id'), // Pre-select group if provided in query
        ]);
    }

    /**
     * Save assigned students to a specific bus.
     */
    public function saveAssignedStudents(Request $request)
    {
        $validated = $request->validate([
            'group_id' => 'required|exists:bus_groups,id',
            'morning_student_ids' => 'array',
            'morning_student_ids.*' => 'exists:students,id',
            'afternoon_student_ids' => 'array',
            'afternoon_student_ids.*' => 'exists:students,id',
        ]);

        $groupId = $validated['group_id'];
        $schoolId = Auth::user()->getSchoolId();

        $group = \App\Models\BusGroup::where('id', $groupId)
            ->where('school_id', $schoolId)
            ->firstOrFail();

        $morningIds = collect($validated['morning_student_ids'] ?? [])->unique()->values()->all();
        $afternoonIds = collect($validated['afternoon_student_ids'] ?? [])->unique()->values()->all();

        // Transaction for safety
        \Illuminate\Support\Facades\DB::transaction(function () use ($schoolId, $groupId, $morningIds, $afternoonIds) {
            // 1. Remove this group from any students who currently have it, but aren't in the new lists
            \App\Models\Student::inSchool($schoolId)
                ->where('morning_group_id', $groupId)
                ->whereNotIn('id', $morningIds)
                ->update(['morning_group_id' => null]);

            \App\Models\Student::inSchool($schoolId)
                ->where('afternoon_group_id', $groupId)
                ->whereNotIn('id', $afternoonIds)
                ->update(['afternoon_group_id' => null]);

            // 2. Add group to morning students
            if (!empty($morningIds)) {
                \App\Models\Student::inSchool($schoolId)
                    ->whereIn('id', $morningIds)
                    ->update(['morning_group_id' => $groupId]);
            }

            // 3. Add group to afternoon students
            if (!empty($afternoonIds)) {
                \App\Models\Student::inSchool($schoolId)
                    ->whereIn('id', $afternoonIds)
                    ->update(['afternoon_group_id' => $groupId]);
            }
        });

        return redirect()->back()->with('success', 'تم حفظ تعيينات المجموعات بنجاح');
    }
}


