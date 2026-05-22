<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
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
            'lat' => 23.5859, // Default Muscat, Oman
            'lng' => 58.4059,
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
     * Update the bus route assignment.
     */
    public function update(Request $request, Bus $bus)
    {
        if ($bus->school_id !== Auth::user()->getSchoolId()) {
            abort(403);
        }

        $validated = $request->validate([
            'route_id' => [
                'nullable', 
                'integer', 
                Rule::exists('routes', 'id')->where('school_id', Auth::user()->getSchoolId())
            ],
        ]);

        $bus->update([
            'route_id' => $validated['route_id']
        ]);

        return back()->with('success', 'تم تحديث مسار الحافلة بنجاح');
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
                    'latitude' => (float) $bus->latitude,
                    'longitude' => (float) $bus->longitude,
                    'trip_status' => $bus->trip_status,
                    'driver' => $bus->driver?->user,
                    'students_count' => $bus->students_count ?? 0,
                ];
            });

        $schoolLocation = [
            'lat' => 23.5859, // Default Muscat, Oman
            'lng' => 58.4059,
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
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get()
            ->map(function ($bus) {
                return [
                    'id' => $bus->id,
                    'lat' => (float) $bus->latitude,
                    'lng' => (float) $bus->longitude,
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
            ->get(['id', 'first_name_ar', 'last_name_ar', 'student_code', 'national_id', 'gender', 'forth_bus_id', 'back_bus_id'])
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

        // Identify newly assigned forth students before updating
        $newlyAssignedForthIds = [];
        if (!empty($forthIds)) {
            $newlyAssignedForthIds = \App\Models\Student::inSchool($schoolId)
                ->whereIn('id', $forthIds)
                ->where(function ($q) use ($busId) {
                    $q->whereNull('forth_bus_id')
                      ->orWhere('forth_bus_id', '!=', $busId);
                })
                ->pluck('id')
                ->toArray();
        }

        // Identify newly assigned back students before updating
        $newlyAssignedBackIds = [];
        if (!empty($backIds)) {
            $newlyAssignedBackIds = \App\Models\Student::inSchool($schoolId)
                ->whereIn('id', $backIds)
                ->where(function ($q) use ($busId) {
                    $q->whereNull('back_bus_id')
                      ->orWhere('back_bus_id', '!=', $busId);
                })
                ->pluck('id')
                ->toArray();
        }

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

        // Send notifications for newly assigned students to the bus crew
        try {
            $notificationService = app(\App\Services\NotificationService::class);

            if (!empty($newlyAssignedForthIds)) {
                $students = \App\Models\Student::whereIn('id', $newlyAssignedForthIds)->get();
                foreach ($students as $student) {
                    $studentName = $student->full_name;
                    $studentNameEn = $student->full_name_en ?: $student->student_code;

                    $notificationService->notifyBusCrew(
                        busId: $busId,
                        type: 'student_added_to_route',
                        title: '👤 إضافة طالب جديد',
                        message: "تم إضافة طالب جديد للمسار الصباحي: {$studentName}",
                        data: [
                            'student_id' => (string) $student->id,
                            'category' => 'students',
                            'target_screen' => 'student_details'
                        ],
                        titleEn: '👤 New Student Added',
                        messageEn: "A new student has been added to the morning route: {$studentNameEn}"
                    );
                }
            }

            if (!empty($newlyAssignedBackIds)) {
                $students = \App\Models\Student::whereIn('id', $newlyAssignedBackIds)->get();
                foreach ($students as $student) {
                    $studentName = $student->full_name;
                    $studentNameEn = $student->full_name_en ?: $student->student_code;

                    $notificationService->notifyBusCrew(
                        busId: $busId,
                        type: 'student_added_to_route',
                        title: '👤 إضافة طالب جديد',
                        message: "تم إضافة طالب جديد لمسار العودة: {$studentName}",
                        data: [
                            'student_id' => (string) $student->id,
                            'category' => 'students',
                            'target_screen' => 'student_details'
                        ],
                        titleEn: '👤 New Student Added',
                        messageEn: "A new student has been added to the return route: {$studentNameEn}"
                    );
                }
            }
        } catch (\Exception $e) {
            \Log::error('Bulk student assignment notification failed: ' . $e->getMessage());
        }

        return redirect()->back()->with('success', 'تم حفظ تعيينات الطلاب بنجاح');
    }
}


