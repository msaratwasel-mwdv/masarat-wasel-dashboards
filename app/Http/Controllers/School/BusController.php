<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\School;
use App\Models\Student;
use App\Traits\HasLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BusController extends Controller
{
    use HasLocation;

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
                Rule::exists('routes', 'id')->where('school_id', Auth::user()->getSchoolId()),
            ],
        ]);

        $bus->update([
            'route_id' => $validated['route_id'],
        ]);

        return back()->with('success', 'تم تحديث مسار الحافلة بنجاح');
    }

    /**
     * Show the standalone live tracking page.
     */
    public function liveTracking()
    {
        $schoolId = Auth::user()->getSchoolId();
        $school = \App\Models\School::find($schoolId);
        $schoolLat = $school && $school->latitude ? (float) $school->latitude : 13.9407;
        $schoolLng = $school && $school->longitude ? (float) $school->longitude : 43.7873;
        $schoolName = $school?->name ?? 'مدرسة مسارات واصل';

        $totalSchoolStudents = Student::inSchool($schoolId)->where('is_active', true)->count();

        $buses = Bus::where('school_id', $schoolId)
            ->with(['driver.user', 'route'])
            ->get()
            ->map(fn ($bus) => $this->formatLiveTrackingBus($bus, $schoolId, $schoolLat, $schoolLng));

        $schoolLocation = [
            'lat' => $schoolLat,
            'lng' => $schoolLng,
            'name' => $schoolName,
        ];

        $stats = [
            'total_buses' => $buses->count(),
            'active_buses' => $buses->where('status', 'active')->count(),
            'moving_buses' => $buses->filter(fn ($b) => ($b['speed_kmh'] ?? 0) > 0 && ($b['is_moving'] ?? false))->count(),
            'total_students' => $totalSchoolStudents,
            'students_on_board' => $buses->sum('students_on_board'),
        ];

        return Inertia::render('School/LiveTracking/Index', [
            'buses' => $buses,
            'schoolLocation' => $schoolLocation,
            'stats' => $stats,
        ]);
    }

    /**
     * API for Real-time Tracking Data
     */
    public function trackingApi()
    {
        $schoolId = Auth::user()->getSchoolId();
        $school = \App\Models\School::find($schoolId);
        $schoolLat = $school && $school->latitude ? (float) $school->latitude : 13.9407;
        $schoolLng = $school && $school->longitude ? (float) $school->longitude : 43.7873;

        $totalSchoolStudents = Student::inSchool($schoolId)->where('is_active', true)->count();

        $buses = Bus::where('school_id', $schoolId)
            ->with(['driver.user', 'route'])
            ->get()
            ->map(fn ($bus) => $this->formatLiveTrackingBus($bus, $schoolId, $schoolLat, $schoolLng));

        $stats = [
            'total_buses' => $buses->count(),
            'active_buses' => $buses->where('status', 'active')->count(),
            'moving_buses' => $buses->filter(fn ($b) => ($b['speed_kmh'] ?? 0) > 0 && ($b['is_moving'] ?? false))->count(),
            'total_students' => $totalSchoolStudents,
            'students_on_board' => $buses->sum('students_on_board'),
        ];

        return response()->json([
            'success' => true,
            'buses' => $buses,
            'stats' => $stats,
        ]);
    }

    protected function formatLiveTrackingBus(Bus $bus, $schoolId, float $schoolLat, float $schoolLng): array
    {
        $lastUpdate = $bus->last_location_update;
        $secondsAgo = $lastUpdate ? $lastUpdate->diffInSeconds(now()) : null;
        // Active ping check: only considered active if an update arrived within the last 60 seconds
        $isPingingRecently = ($secondsAgo !== null && $secondsAgo <= 60);

        $rawSpeed = $isPingingRecently ? (float) cache()->get('bus_speed_'.$bus->id, 0) : 0.0;
        // Filter out micro GPS noise (speeds under 3 km/h are considered stopped)
        $speed = ($rawSpeed >= 3.0) ? round($rawSpeed, 1) : 0.0;
        $isMoving = ($speed > 0.0) && $isPingingRecently;
        $heading = (float) cache()->get('bus_heading_'.$bus->id, 0);

        // 1. Retrieve today's trip (priority: in_progress > awaiting_confirmation > pending)
        $currentTrip = $bus->trips()
            ->whereDate('trip_date', today())
            ->whereIn('status', ['in_progress', 'awaiting_confirmation', 'pending'])
            ->with(['attendances.student', 'route'])
            ->orderByRaw("CASE WHEN status = 'in_progress' THEN 1 WHEN status = 'awaiting_confirmation' THEN 2 ELSE 3 END")
            ->latest('id')
            ->first();

        // Determine trip direction (forth / back)
        $tripType = $currentTrip ? $currentTrip->type : (now()->hour < 13 ? 'forth' : 'back');
        $busColumn = ($tripType === 'forth') ? 'forth_bus_id' : 'back_bus_id';

        $studentsData = [];
        $waypoints = [];

        if ($currentTrip && $currentTrip->attendances->isNotEmpty()) {
            $attendanceStudents = $currentTrip->attendances->map(function ($att) {
                $student = $att->student;
                if ($student) {
                    $student->setRelation('_attendance', $att);
                }

                return $student;
            })->filter();

            $busLat = $bus->latitude ? (float) $bus->latitude : null;
            $busLng = $bus->longitude ? (float) $bus->longitude : null;

            $sortedStudents = $this->sortStudentsByOptimalSequence(
                $attendanceStudents,
                $schoolLat,
                $schoolLng,
                $tripType,
                $busLat,
                $busLng
            );

            foreach ($sortedStudents as $student) {
                $att = $student->_attendance ?? $student->getRelation('_attendance');
                $isForth = ($tripType === 'forth');
                $lat = $isForth
                    ? ($student->forth_latitude ?? $student->latitude)
                    : ($student->back_latitude ?? $student->latitude);
                $lng = $isForth
                    ? ($student->forth_longitude ?? $student->longitude)
                    : ($student->back_longitude ?? $student->longitude);

                $studentItem = [
                    'attendance_id' => $att?->id ?? 0,
                    'student_id' => $student->id,
                    'name' => trim(($student->first_name_ar ?? '').' '.($student->last_name_ar ?? '')) ?: ($student->first_name_en ?? 'طالب'),
                    'student_code' => $student->student_code,
                    'status' => $att?->status ?? 'pending',
                    'check_in_time' => $att?->check_in_time?->format('H:i'),
                    'check_out_time' => $att?->check_out_time?->format('H:i'),
                    'extra_wait_time' => $att?->extra_wait_time ?? 0,
                    'lat' => $lat ? (float) $lat : null,
                    'lng' => $lng ? (float) $lng : null,
                    'address' => $student->address,
                ];

                $studentsData[] = $studentItem;

                if ($lat && $lng) {
                    $waypoints[] = [
                        'lat' => (float) $lat,
                        'lng' => (float) $lng,
                        'student_id' => $student->id,
                        'name' => $studentItem['name'],
                        'status' => $att?->status ?? 'pending',
                    ];
                }
            }
        } else {
            // Bus is idle: load scheduled students assigned to this bus shift
            $assignedStudents = Student::inSchool($schoolId)
                ->where('is_active', true)
                ->where($busColumn, $bus->id)
                ->get();

            $busLat = $bus->latitude ? (float) $bus->latitude : null;
            $busLng = $bus->longitude ? (float) $bus->longitude : null;

            $sortedStudents = $this->sortStudentsByOptimalSequence(
                $assignedStudents,
                $schoolLat,
                $schoolLng,
                $tripType,
                $busLat,
                $busLng
            );

            foreach ($sortedStudents as $student) {
                $isForth = ($tripType === 'forth');
                $lat = $isForth
                    ? ($student->forth_latitude ?? $student->latitude)
                    : ($student->back_latitude ?? $student->latitude);
                $lng = $isForth
                    ? ($student->forth_longitude ?? $student->longitude)
                    : ($student->back_longitude ?? $student->longitude);

                $studentItem = [
                    'attendance_id' => 0,
                    'student_id' => $student->id,
                    'name' => trim(($student->first_name_ar ?? '').' '.($student->last_name_ar ?? '')) ?: ($student->first_name_en ?? 'طالب'),
                    'student_code' => $student->student_code,
                    'status' => 'pending',
                    'check_in_time' => null,
                    'check_out_time' => null,
                    'extra_wait_time' => 0,
                    'lat' => $lat ? (float) $lat : null,
                    'lng' => $lng ? (float) $lng : null,
                    'address' => $student->address,
                ];

                $studentsData[] = $studentItem;

                if ($lat && $lng) {
                    $waypoints[] = [
                        'lat' => (float) $lat,
                        'lng' => (float) $lng,
                        'student_id' => $student->id,
                        'name' => $studentItem['name'],
                        'status' => 'pending',
                    ];
                }
            }
        }

        // Add School landmark to waypoints
        if (! empty($waypoints)) {
            if ($tripType === 'forth') {
                $waypoints[] = [
                    'lat' => $schoolLat,
                    'lng' => $schoolLng,
                    'is_school' => true,
                    'name' => 'المدرسة',
                ];
            } else {
                array_unshift($waypoints, [
                    'lat' => $schoolLat,
                    'lng' => $schoolLng,
                    'is_school' => true,
                    'name' => 'المدرسة',
                ]);
            }
        }

        // Count enrolled students belonging to this school that are assigned to this bus
        $assignedStudentsCount = Student::inSchool($schoolId)
            ->where('is_active', true)
            ->where(function ($q) use ($bus) {
                $q->where('forth_bus_id', $bus->id)
                    ->orWhere('back_bus_id', $bus->id);
            })
            ->count();

        $tripStatus = $currentTrip ? $currentTrip->status : 'idle';

        return [
            'id' => $bus->id,
            'bus_number' => $bus->bus_number,
            'plate_number' => $bus->plate_number,
            'capacity' => $bus->capacity,
            'status' => $bus->status,
            'latitude' => $bus->latitude ? (float) $bus->latitude : null,
            'longitude' => $bus->longitude ? (float) $bus->longitude : null,
            'current_latitude' => $bus->latitude ? (float) $bus->latitude : null,
            'current_longitude' => $bus->longitude ? (float) $bus->longitude : null,
            'trip_status' => $tripStatus,
            'speed_kmh' => $speed,
            'is_moving' => $isMoving,
            'heading' => $heading,
            'students_count' => $assignedStudentsCount,
            'students_on_board' => $currentTrip ? $currentTrip->attendances->whereIn('status', ['boarded', 'present'])->count() : 0,
            'driver' => $bus->driver?->user ? [
                'id' => $bus->driver->user->id,
                'name' => $bus->driver->user->name,
                'phone' => $bus->driver->user->phone,
            ] : null,
            'route' => $bus->route ? [
                'id' => $bus->route->id,
                'name' => $bus->route->name,
            ] : null,
            'active_trip' => [
                'id' => $currentTrip?->id ?? 0,
                'type' => $tripType,
                'status' => $tripStatus,
                'students' => $studentsData,
                'waypoints' => $waypoints,
            ],
            'last_update' => $bus->last_location_update ? $bus->last_location_update->diffForHumans() : null,
        ];
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
            ->map(fn ($bus) => [
                'id' => $bus->id,
                'bus_number' => $bus->bus_number,
                'plate_number' => $bus->plate_number,
                'capacity' => $bus->capacity,
                'route' => $bus->route ? ['id' => $bus->route->id, 'name' => $bus->route->name] : null,
                'driver' => $bus->driver?->user?->name,
                'assistant' => $bus->assistant?->name,
            ]);

        $students = \App\Models\Student::inSchool($schoolId)
            ->where('is_active', true)
            ->orderBy('first_name_ar')
            ->get(['id', 'first_name_ar', 'last_name_ar', 'student_code', 'national_id', 'gender', 'forth_bus_id', 'back_bus_id', 'forth_stop_order', 'back_stop_order', 'latitude', 'longitude'])
            ->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->full_name,
                'student_code' => $s->student_code,
                'national_id' => $s->national_id,
                'gender' => $s->gender,
                'forth_bus_id' => $s->forth_bus_id,
                'back_bus_id' => $s->back_bus_id,
                'forth_stop_order' => $s->forth_stop_order ?? 0,
                'back_stop_order' => $s->back_stop_order ?? 0,
                'latitude' => $s->latitude,
                'longitude' => $s->longitude,
            ]);

        $school = Auth::user()->school;
        $schoolData = [
            'name' => $school?->name ?? 'المدرسة',
            'latitude' => $school?->latitude ? (float) $school->latitude : 23.5859,
            'longitude' => $school?->longitude ? (float) $school->longitude : 58.4059,
        ];

        return Inertia::render('School/Buses/AssignStudents', [
            'buses' => $buses,
            'students' => $students,
            'selectedBusId' => $request->query('bus_id'),
            'school' => $schoolData,
        ]);
    }

    /**
     * Save student-to-bus assignments (forth + back trip).
     */
    public function saveAssignedStudents(Request $request)
    {
        $validated = $request->validate([
            'bus_id' => 'required|exists:buses,id',
            'forth_student_ids' => 'array',
            'forth_student_ids.*' => 'exists:students,id',
            'back_student_ids' => 'array',
            'back_student_ids.*' => 'exists:students,id',
        ]);

        $busId = $validated['bus_id'];
        $schoolId = Auth::user()->getSchoolId();

        // Ensure the bus belongs to this school
        Bus::where('id', $busId)->where('school_id', $schoolId)->firstOrFail();

        $forthIds = collect($validated['forth_student_ids'] ?? [])->unique()->values()->all();
        $backIds = collect($validated['back_student_ids'] ?? [])->unique()->values()->all();

        // Identify newly assigned forth students before updating
        $newlyAssignedForthIds = [];
        if (! empty($forthIds)) {
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
        if (! empty($backIds)) {
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
            if (! empty($forthIds)) {
                \App\Models\Student::inSchool($schoolId)
                    ->whereIn('id', $forthIds)
                    ->update(['forth_bus_id' => $busId]);
            }

            // Assign back students
            if (! empty($backIds)) {
                \App\Models\Student::inSchool($schoolId)
                    ->whereIn('id', $backIds)
                    ->update(['back_bus_id' => $busId]);
            }
        });

        // Send notifications for newly assigned students to the bus crew
        try {
            $notificationService = app(\App\Services\NotificationService::class);

            if (! empty($newlyAssignedForthIds)) {
                $students = \App\Models\Student::whereIn('id', $newlyAssignedForthIds)->get();
                foreach ($students as $student) {
                    try {
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
                                'target_screen' => 'student_details',
                            ],
                            titleEn: '👤 New Student Added',
                            messageEn: "A new student has been added to the morning route: {$studentNameEn}"
                        );
                    } catch (\Exception $e) {
                        \Log::warning("Failed to notify crew for student #{$student->id}: ".$e->getMessage());
                    }
                }
            }

            if (! empty($newlyAssignedBackIds)) {
                $students = \App\Models\Student::whereIn('id', $newlyAssignedBackIds)->get();
                foreach ($students as $student) {
                    try {
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
                                'target_screen' => 'student_details',
                            ],
                            titleEn: '👤 New Student Added',
                            messageEn: "A new student has been added to the return route: {$studentNameEn}"
                        );
                    } catch (\Exception $e) {
                        \Log::warning("Failed to notify crew for student #{$student->id}: ".$e->getMessage());
                    }
                }
            }
        } catch (\Exception $e) {
            \Log::error('Bulk student assignment notification failed: '.$e->getMessage());
        }

        return redirect()->back()->with('success', 'تم حفظ تعيينات الطلاب بنجاح');
    }

    /**
     * Optimize student stop order via Google Directions waypoint optimization
     * with automatic fallback to internal nearest-neighbor spatial algorithm.
     */
    public function optimizeRouteWithGoogle(Request $request)
    {
        $validated = $request->validate([
            'bus_id' => 'required|exists:buses,id',
            'trip_type' => 'required|in:morning,afternoon',
        ]);

        $busId = $validated['bus_id'];
        $tripType = $validated['trip_type'];
        $schoolId = Auth::user()->getSchoolId();

        $bus = Bus::where('id', $busId)->where('school_id', $schoolId)->firstOrFail();
        $school = $bus->school ?? Auth::user()->school;

        $schoolLat = (float) ($school?->latitude ?? 23.5859);
        $schoolLng = (float) ($school?->longitude ?? 58.4059);

        // Fetch students assigned to this bus for this trip
        $column = $tripType === 'morning' ? 'forth_bus_id' : 'back_bus_id';
        $students = Student::inSchool($schoolId)
            ->where($column, $busId)
            ->where('is_active', true)
            ->get();

        if ($students->count() < 2) {
            return response()->json([
                'success' => false,
                'message' => 'يجب أن يكون هناك طالبان على الأقل لتحسين المسار',
            ], 422);
        }

        // Filter students with valid coordinates
        $validStudents = $students->filter(function ($s) {
            return ! empty($s->latitude) && ! empty($s->longitude) && (float) $s->latitude != 0.0;
        })->values();

        if ($validStudents->count() < 2) {
            return response()->json([
                'success' => false,
                'message' => 'الطلاب لا يملكون إحداثيات موقع صالحة',
            ], 422);
        }

        $apiKey = config('services.google_maps.key') ?: env('Maps_API_KEY');

        // 1. Attempt Google Directions API if key exists and waypoints limit is respected (<= 25)
        if (! empty($apiKey) && $validStudents->count() <= 25) {
            try {
                if ($tripType === 'morning') {
                    $startStudent = $validStudents->first();
                    $origin = "{$startStudent->latitude},{$startStudent->longitude}";
                    $destination = "{$schoolLat},{$schoolLng}";
                    $intermediate = $validStudents->filter(fn ($s) => $s->id !== $startStudent->id);
                } else {
                    $endStudent = $validStudents->last();
                    $origin = "{$schoolLat},{$schoolLng}";
                    $destination = "{$endStudent->latitude},{$endStudent->longitude}";
                    $intermediate = $validStudents->filter(fn ($s) => $s->id !== $endStudent->id);
                }

                $params = [
                    'origin' => $origin,
                    'destination' => $destination,
                    'departure_time' => 'now',
                    'mode' => 'driving',
                    'key' => $apiKey,
                ];

                if ($intermediate->isNotEmpty()) {
                    $params['waypoints'] = 'optimize:true|'.$intermediate->map(fn ($s) => "{$s->latitude},{$s->longitude}")->implode('|');
                }

                $response = \Illuminate\Support\Facades\Http::timeout(5)->get('https://maps.googleapis.com/maps/api/directions/json', $params);

                if ($response->successful() && ($response->json('status') === 'OK')) {
                    $waypointOrder = $response->json('routes.0.waypoint_order', []);
                    $intermediateList = $intermediate->values();
                    $orderedStudents = [];

                    if ($tripType === 'morning') {
                        $orderedStudents[] = [
                            'student_id' => $startStudent->id,
                            'order' => 1,
                        ];
                        foreach ($waypointOrder as $newIdx => $origIdx) {
                            if (isset($intermediateList[$origIdx])) {
                                $orderedStudents[] = [
                                    'student_id' => $intermediateList[$origIdx]->id,
                                    'order' => count($orderedStudents) + 1,
                                ];
                            }
                        }
                    } else {
                        foreach ($waypointOrder as $newIdx => $origIdx) {
                            if (isset($intermediateList[$origIdx])) {
                                $orderedStudents[] = [
                                    'student_id' => $intermediateList[$origIdx]->id,
                                    'order' => count($orderedStudents) + 1,
                                ];
                            }
                        }
                        $orderedStudents[] = [
                            'student_id' => $endStudent->id,
                            'order' => count($orderedStudents) + 1,
                        ];
                    }

                    // Append any remaining students not covered
                    $orderedIds = collect($orderedStudents)->pluck('student_id')->toArray();
                    $remainingStudents = $validStudents->whereNotIn('id', $orderedIds);
                    $currOrder = count($orderedStudents) + 1;
                    foreach ($remainingStudents as $remStudent) {
                        $orderedStudents[] = [
                            'student_id' => $remStudent->id,
                            'order' => $currOrder++,
                        ];
                    }

                    return response()->json([
                        'success' => true,
                        'source' => 'google',
                        'ordered_students' => $orderedStudents,
                    ]);
                }

                Log::info('Google Directions returned non-OK status: '.$response->json('status', 'unknown').'. Using fallback.');
            } catch (\Exception $e) {
                Log::warning('Google route optimization failed: '.$e->getMessage().'. Using fallback.');
            }
        }

        // 2. Fallback: Run internal Nearest-Neighbor spatial algorithm
        $busLat = ($bus->latitude && (float) $bus->latitude != 0.0) ? (float) $bus->latitude : null;
        $busLng = ($bus->longitude && (float) $bus->longitude != 0.0) ? (float) $bus->longitude : null;

        $sortedStudents = $this->sortStudentsByOptimalSequence(
            $validStudents,
            $schoolLat,
            $schoolLng,
            $tripType,
            $busLat,
            $busLng
        );

        $orderedStudents = [];
        $currOrder = 1;
        foreach ($sortedStudents as $student) {
            $orderedStudents[] = [
                'student_id' => $student->id,
                'order' => $currOrder++,
            ];
        }

        return response()->json([
            'success' => true,
            'source' => 'nearest_neighbor',
            'ordered_students' => $orderedStudents,
            'message' => 'تم تحسين المسار بنجاح وفق خوارزمية المسافة الأقرب.',
        ]);
    }

    /**
     * Save custom or optimized stop order for students on a bus.
     */
    public function saveStopOrder(Request $request)
    {
        $validated = $request->validate([
            'bus_id' => 'required|exists:buses,id',
            'trip_type' => 'required|in:morning,afternoon',
            'orders' => 'required|array',
            'orders.*.student_id' => 'required|exists:students,id',
            'orders.*.order' => 'required|integer|min:1',
        ]);

        $schoolId = Auth::user()->getSchoolId();
        Bus::where('id', $validated['bus_id'])->where('school_id', $schoolId)->firstOrFail();

        $orderColumn = $validated['trip_type'] === 'morning' ? 'forth_stop_order' : 'back_stop_order';

        DB::transaction(function () use ($validated, $orderColumn, $schoolId) {
            foreach ($validated['orders'] as $item) {
                Student::inSchool($schoolId)
                    ->where('id', $item['student_id'])
                    ->update([$orderColumn => $item['order']]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ ترتيب المحطات بنجاح',
        ]);
    }
}
