<?php

namespace App\Http\Controllers\Dev;

use App\Events\BusLocationUpdated;
use App\Events\DriverLocationUpdated;
use App\Events\StudentStatusUpdated;
use App\Events\TripStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\School;
use App\Models\Student;
use App\Models\Trip;
use App\Models\TripAttendance;
use App\Models\WhatsAppLog;
use App\Services\TripService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TripSimulatorController extends Controller
{
    public function __construct(protected TripService $tripService) {}

    /**
     * Display the Standalone Dev Trip Simulator page.
     */
    public function index(Request $request)
    {
        $schools = School::where('is_active', true)
            ->select('id', 'name', 'latitude', 'longitude')
            ->get();

        if ($schools->isEmpty()) {
            $schools = School::select('id', 'name', 'latitude', 'longitude')->get();
        }

        $selectedSchoolId = (int) $request->input('school_id', $schools->first()?->id ?? 1);
        $schoolData = $this->loadSchoolData($selectedSchoolId);

        return Inertia::render('Dev/TripSimulator', [
            'schools' => $schools,
            'selectedSchoolId' => $selectedSchoolId,
            'school' => $schoolData['school'],
            'schoolBuses' => $schoolData['buses'],
            'schoolStudents' => $schoolData['students'],
            'initialTrips' => $schoolData['trips'],
            'googleMapsApiKey' => config('services.google.maps_key') ?: env('VITE_GOOGLE_MAPS_API_KEY', ''),
        ]);
    }

    /**
     * API to fetch real school data (buses, enrolled students, active trips) dynamically.
     */
    public function getSchoolData(Request $request)
    {
        $request->validate([
            'school_id' => 'required|exists:schools,id',
        ]);

        $schoolData = $this->loadSchoolData((int) $request->school_id);

        return response()->json([
            'success' => true,
            ...$schoolData,
        ]);
    }

    /**
     * Load real database data for a specific school.
     */
    protected function loadSchoolData(int $schoolId): array
    {
        $school = School::find($schoolId);
        $schoolLat = $school && $school->latitude ? (float) $school->latitude : 24.7136;
        $schoolLng = $school && $school->longitude ? (float) $school->longitude : 46.6753;

        // 1. Real buses assigned to this school
        $buses = Bus::where('school_id', $schoolId)
            ->with(['driver.user', 'assistant', 'route'])
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id,
                    'bus_number' => $b->bus_number,
                    'plate_number' => $b->plate_number,
                    'capacity' => $b->capacity,
                    'latitude' => $b->latitude ? (float) $b->latitude : null,
                    'longitude' => $b->longitude ? (float) $b->longitude : null,
                    'driver_name' => $b->driver?->user?->name ?? 'غير محدد',
                    'driver_id' => $b->driver_id,
                    'route_id' => $b->route_id,
                    'route_name' => $b->route?->name ?? null,
                    'status' => $b->status,
                ];
            });

        // 2. Real enrolled students in this school
        $students = Student::inSchool($schoolId)
            ->where('is_active', true)
            ->with(['currentEnrollment.classroom', 'guardians'])
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'name' => trim(($s->first_name_ar ?? '').' '.($s->last_name_ar ?? '')) ?: ($s->first_name_en ?? $s->student_code),
                    'student_code' => $s->student_code,
                    'gender' => $s->gender,
                    'classroom' => $s->currentEnrollment?->classroom?->name ?? '-',
                    'forth_bus_id' => $s->forth_bus_id,
                    'back_bus_id' => $s->back_bus_id,
                    'lat' => $s->latitude ? (float) $s->latitude : null,
                    'lng' => $s->longitude ? (float) $s->longitude : null,
                    'forth_latitude' => $s->forth_latitude ? (float) $s->forth_latitude : null,
                    'forth_longitude' => $s->forth_longitude ? (float) $s->forth_longitude : null,
                    'back_latitude' => $s->back_latitude ? (float) $s->back_latitude : null,
                    'back_longitude' => $s->back_longitude ? (float) $s->back_longitude : null,
                    'address' => $s->address ?? 'غير محدد',
                ];
            });

        // 3. Real trips for today in this school
        $trips = Trip::where('school_id', $schoolId)
            ->whereDate('trip_date', today())
            ->with([
                'bus.driver.user',
                'bus.assistant',
                'school',
                'route',
                'attendances.student',
            ])
            ->orderByRaw("CASE WHEN status = 'in_progress' THEN 1 WHEN status = 'pending' THEN 2 ELSE 3 END")
            ->latest('id')
            ->get()
            ->map(fn ($t) => $this->formatTripData($t));

        return [
            'school' => [
                'id' => $school?->id ?? $schoolId,
                'name' => $school?->name ?? 'المدرسة',
                'latitude' => $schoolLat,
                'longitude' => $schoolLng,
            ],
            'buses' => $buses,
            'students' => $students,
            'trips' => $trips,
        ];
    }

    /**
     * Create and start a real trip for a specific bus and school.
     */
    public function createTrip(Request $request)
    {
        $request->validate([
            'school_id' => 'required|exists:schools,id',
            'bus_id' => 'required|exists:buses,id',
            'type' => 'required|in:forth,back',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $school = School::findOrFail($request->school_id);
        $bus = Bus::where('school_id', $school->id)->findOrFail($request->bus_id);

        // Check if there is already an active in_progress trip for this bus today
        $existingActiveTrip = Trip::where('bus_id', $bus->id)
            ->whereDate('trip_date', today())
            ->where('status', 'in_progress')
            ->first();

        if ($existingActiveTrip) {
            return response()->json([
                'success' => false,
                'message' => "يوجد بالفعل رحلة نشطة حالياً لهذه الحافلة اليوم (رحلة #{$existingActiveTrip->id}). يرجى إنهاؤها أولاً قبل بدء رحلة جديدة.",
                'trip' => $this->formatTripData($existingActiveTrip->fresh(['bus.driver.user', 'bus.assistant', 'school', 'route', 'attendances.student'])),
            ], 422);
        }

        // Set bus initial coordinates near school/route if not already set
        $schoolLat = $school->latitude ? (float) $school->latitude : 24.7136;
        $schoolLng = $school->longitude ? (float) $school->longitude : 46.6753;

        $startLat = $bus->latitude ? (float) $bus->latitude : $schoolLat;
        $startLng = $bus->longitude ? (float) $bus->longitude : $schoolLng;

        $trip = DB::transaction(function () use ($school, $bus, $request, $startLat, $startLng) {
            $newTrip = Trip::create([
                'school_id' => $school->id,
                'bus_id' => $bus->id,
                'driver_id' => $bus->driver_id,
                'route_id' => $bus->route_id,
                'trip_date' => today(),
                'type' => $request->type,
                'status' => 'in_progress',
                'departure_time' => now(),
                'generation_type' => 'manual',
            ]);

            // Add selected students to trip attendances
            $studentIds = $request->input('student_ids', []);
            if (! empty($studentIds)) {
                $validStudents = Student::inSchool($school->id)->whereIn('id', $studentIds)->get();
                foreach ($validStudents as $stu) {
                    TripAttendance::create([
                        'trip_id' => $newTrip->id,
                        'student_id' => $stu->id,
                        'status' => 'pending',
                    ]);
                }
            }

            $bus->update([
                'latitude' => $startLat,
                'longitude' => $startLng,
                'last_location_update' => now(),
            ]);

            return $newTrip;
        });

        Cache::put('bus_speed_'.$bus->id, 0.0, now()->addMinutes(10));
        Cache::put('bus_heading_'.$bus->id, 0.0, now()->addMinutes(10));

        \App\Helpers\BroadcastHelper::safeBroadcast(new TripStatusUpdated($trip, $bus, 'in_progress'));

        $freshTrip = $this->formatTripData($trip->fresh(['bus.driver.user', 'bus.assistant', 'school', 'route', 'attendances.student']));

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء وبدء الرحلة الحقيقية بنجاح.',
            'trip' => $freshTrip,
        ]);
    }

    /**
     * Get live list of trips for the current school.
     */
    public function getScheduledTrips(Request $request)
    {
        $schoolId = $request->input('school_id');
        $query = Trip::with([
            'bus.driver.user',
            'bus.assistant',
            'school',
            'route',
            'attendances.student',
        ]);

        if ($schoolId) {
            $query->where('school_id', $schoolId);
        }

        $trips = $query->whereDate('trip_date', today())
            ->orderByRaw("CASE WHEN status = 'in_progress' THEN 1 WHEN status = 'pending' THEN 2 ELSE 3 END")
            ->latest('id')
            ->get()
            ->map(fn ($trip) => $this->formatTripData($trip));

        return response()->json([
            'success' => true,
            'trips' => $trips,
        ]);
    }

    /**
     * Start a pending trip.
     */
    public function startTrip(Request $request)
    {
        $request->validate([
            'trip_id' => 'required|exists:trips,id',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $trip = Trip::with(['bus', 'school'])->findOrFail($request->trip_id);
        $bus = $trip->bus;

        // Update trip status
        $trip->update([
            'status' => 'in_progress',
            'departure_time' => $trip->departure_time ?? now(),
        ]);

        if ($bus) {
            $busUpdate = ['last_location_update' => now()];
            if ($request->filled('latitude') && $request->filled('longitude')) {
                $busUpdate['latitude'] = $request->latitude;
                $busUpdate['longitude'] = $request->longitude;
            }
            $bus->update($busUpdate);

            \App\Helpers\BroadcastHelper::safeBroadcast(new TripStatusUpdated($trip, $bus, 'in_progress'));
        }

        $freshTrip = $this->formatTripData($trip->fresh(['bus.driver.user', 'bus.assistant', 'attendances.student', 'school', 'route']));

        return response()->json([
            'success' => true,
            'message' => 'تم بدء الرحلة بنجاح.',
            'trip' => $freshTrip,
        ]);
    }

    /**
     * Ping location update (Simulate real GPS movement).
     */
    public function pingLocation(Request $request)
    {
        $request->validate([
            'bus_id' => 'required|exists:buses,id',
            'trip_id' => 'nullable|exists:trips,id',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'heading' => 'nullable|numeric',
            'speed_kmh' => 'nullable|numeric',
        ]);

        $bus = Bus::findOrFail($request->bus_id);
        $heading = (float) $request->input('heading', 0);
        $speedKmh = (float) $request->input('speed_kmh', 40);

        DB::table('buses')->where('id', $bus->id)->update([
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'last_location_update' => now(),
            'updated_at' => now(),
        ]);

        Cache::put('bus_speed_'.$bus->id, min(round($speedKmh, 1), 140), now()->addMinutes(5));
        Cache::put('bus_heading_'.$bus->id, $heading, now()->addMinutes(5));

        $onBoardCount = 0;
        if ($request->trip_id) {
            $onBoardCount = TripAttendance::where('trip_id', $request->trip_id)
                ->where('status', 'boarded')
                ->count();
        }

        \App\Helpers\BroadcastHelper::safeBroadcast(new BusLocationUpdated(
            $bus,
            (float) $request->latitude,
            (float) $request->longitude,
            $heading,
            $onBoardCount
        ));

        \App\Helpers\BroadcastHelper::safeBroadcast(new DriverLocationUpdated(
            $bus,
            (float) $request->latitude,
            (float) $request->longitude,
            $heading
        ));

        return response()->json([
            'success' => true,
            'bus_id' => $bus->id,
            'latitude' => (float) $request->latitude,
            'longitude' => (float) $request->longitude,
            'speed_kmh' => $speedKmh,
            'heading' => $heading,
            'on_board_count' => $onBoardCount,
        ]);
    }

    /**
     * Update attendance of a specific student in the trip.
     */
    public function updateStudentAttendance(Request $request)
    {
        $request->validate([
            'attendance_id' => 'required|exists:trip_attendances,id',
            'status' => 'required|in:pending,waiting,boarded,dropped,absent,excused',
            'extra_wait_time' => 'nullable|integer|min:0',
        ]);

        $attendance = TripAttendance::findOrFail($request->attendance_id);
        $updateData = [
            'status' => $request->status,
            'updated_at' => now(),
        ];

        if ($request->status === 'boarded' && ! $attendance->check_in_time) {
            $updateData['check_in_time'] = now();
        }

        if ($request->status === 'dropped' && ! $attendance->check_out_time) {
            $updateData['check_out_time'] = now();
        }

        if ($request->has('extra_wait_time')) {
            $updateData['extra_wait_time'] = (int) $request->extra_wait_time;
        }

        DB::table('trip_attendances')->where('id', $attendance->id)->update($updateData);

        if (\App\Helpers\BroadcastHelper::isReverbRunning()) {
            try {
                $freshAttendance = TripAttendance::with(['student', 'trip.bus'])->find($attendance->id);
                if ($freshAttendance?->trip?->bus && $freshAttendance->student) {
                    $action = ($request->status === 'boarded') ? 'board' : (($request->status === 'dropped') ? 'alight' : 'absent');
                    $direction = ($freshAttendance->trip->type === 'forth') ? 'to_school' : 'to_home';
                    broadcast(new StudentStatusUpdated($freshAttendance->student, $freshAttendance->trip->bus, $action, $direction));
                }
            } catch (\Throwable $e) {
                \Log::warning('StudentStatusUpdated broadcast failed in simulator: '.$e->getMessage());
            }
        }

        $freshTrip = $this->formatTripData($attendance->trip->fresh(['bus.driver.user', 'bus.assistant', 'attendances.student', 'school', 'route']));

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة الطالب بنجاح.',
            'status' => $request->status,
            'trip' => $freshTrip,
        ]);
    }

    /**
     * Smart Batch Simulation for all students on the trip.
     */
    public function smartBatchAttendance(Request $request)
    {
        $request->validate([
            'trip_id' => 'required|exists:trips,id',
        ]);

        $trip = Trip::with('attendances.student')->findOrFail($request->trip_id);
        $attendances = $trip->attendances;

        $count = $attendances->count();
        if ($count === 0) {
            return response()->json(['success' => false, 'message' => 'لا يوجد طلاب في هذه الرحلة.']);
        }

        $idx = 0;
        foreach ($attendances as $att) {
            $idx++;
            if ($count >= 4 && $idx === $count) {
                DB::table('trip_attendances')->where('id', $att->id)->update([
                    'status' => 'absent',
                    'extra_wait_time' => 3,
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('trip_attendances')->where('id', $att->id)->update([
                    'status' => 'boarded',
                    'check_in_time' => now()->subMinutes($idx * 2),
                    'extra_wait_time' => ($idx === 1) ? 2 : 0,
                    'updated_at' => now(),
                ]);
            }
        }

        $freshTrip = $this->formatTripData($trip->fresh(['bus.driver.user', 'bus.assistant', 'attendances.student', 'school', 'route']));

        return response()->json([
            'success' => true,
            'message' => 'تم تطبيق التحضير السريع للطلاب بنجاح.',
            'trip' => $freshTrip,
        ]);
    }

    /**
     * End the real trip.
     * This automatically triggers TripObserver which dispatches WhatsApp report and updates dashboard stats!
     */
    public function endTrip(Request $request)
    {
        $request->validate([
            'trip_id' => 'required|exists:trips,id',
            'distance_km' => 'nullable|numeric|min:0',
        ]);

        $trip = Trip::with(['bus', 'school', 'attendances.student', 'route'])->findOrFail($request->trip_id);
        $bus = $trip->bus;

        // Auto-resolve attendances for completion: boarded/pending -> dropped
        $trip->attendances()->whereIn('status', ['boarded', 'pending'])->update([
            'status' => 'dropped',
            'check_out_time' => now(),
            'updated_at' => now(),
        ]);

        $distanceKm = (float) $request->input('distance_km', $trip->actual_distance_km);
        if ($distanceKm <= 0 && $trip->route?->estimated_distance_km > 0) {
            $distanceKm = (float) $trip->route->estimated_distance_km;
        }

        // Set trip to finished (triggers TripObserver)
        $trip->update([
            'status' => 'finished',
            'arrival_time' => now(),
            'actual_distance_km' => $distanceKm,
            'video_check' => true,
        ]);

        if ($bus) {
            Cache::put('bus_speed_'.$bus->id, 0.0, now()->addMinutes(5));
            \App\Helpers\BroadcastHelper::safeBroadcast(new TripStatusUpdated($trip, $bus, 'finished'));
        }

        // Fetch recent WhatsApp log generated for this trip
        $recentLog = WhatsAppLog::latest('id')->first();

        return response()->json([
            'success' => true,
            'message' => 'تم إنهاء الرحلة بنجاح وإطلاق تقرير الواتساب وتحديث الداشبورد.',
            'whatsapp_log' => $recentLog,
        ]);
    }

    /**
     * Reset trip back to pending.
     */
    public function resetTrip(Request $request)
    {
        $request->validate([
            'trip_id' => 'required|exists:trips,id',
        ]);

        $trip = Trip::with('attendances')->findOrFail($request->trip_id);
        $trip->update([
            'status' => 'pending',
            'arrival_time' => null,
            'actual_distance_km' => 0,
        ]);

        $trip->attendances()->update([
            'status' => 'pending',
            'check_in_time' => null,
            'check_out_time' => null,
            'extra_wait_time' => 0,
        ]);

        if ($trip->bus) {
            Cache::put('bus_speed_'.$trip->bus->id, 0.0, now()->addMinutes(5));
            \App\Helpers\BroadcastHelper::safeBroadcast(new TripStatusUpdated($trip, $trip->bus, 'pending'));
        }

        $freshTrip = $this->formatTripData($trip->fresh(['bus.driver.user', 'bus.assistant', 'attendances.student', 'school', 'route']));

        return response()->json([
            'success' => true,
            'message' => 'تمت إعادة ضبط الرحلة إلى معلقة.',
            'trip' => $freshTrip,
        ]);
    }

    /**
     * Fetch WhatsApp logs sent by the system.
     */
    public function getWhatsAppLogs()
    {
        $logs = WhatsAppLog::latest('id')->take(10)->get();

        return response()->json([
            'success' => true,
            'logs' => $logs,
        ]);
    }

    /**
     * Format a Trip model for frontend serialization.
     */
    protected function formatTripData(Trip $trip): array
    {
        $bus = $trip->bus;
        $school = $trip->school;
        $driver = $bus?->driver?->user;

        $schoolLat = $school?->latitude ? (float) $school->latitude : 24.7136;
        $schoolLng = $school?->longitude ? (float) $school->longitude : 46.6753;

        $students = $trip->attendances->map(function ($attendance) use ($trip) {
            $student = $attendance->student;
            $lat = null;
            $lng = null;

            if ($student) {
                if ($trip->type === 'forth') {
                    $lat = $student->forth_latitude ?? $student->latitude;
                    $lng = $student->forth_longitude ?? $student->longitude;
                } else {
                    $lat = $student->back_latitude ?? $student->latitude;
                    $lng = $student->back_longitude ?? $student->longitude;
                }
            }

            return [
                'attendance_id' => $attendance->id,
                'student_id' => $student?->id,
                'name' => trim(($student?->first_name_ar ?? '').' '.($student?->last_name_ar ?? '')) ?: ($student?->first_name_en ?? 'طالب'),
                'student_code' => $student?->student_code,
                'status' => $attendance->status,
                'check_in_time' => $attendance->check_in_time?->format('H:i'),
                'check_out_time' => $attendance->check_out_time?->format('H:i'),
                'extra_wait_time' => $attendance->extra_wait_time ?? 0,
                'lat' => $lat ? (float) $lat : null,
                'lng' => $lng ? (float) $lng : null,
                'address' => $student?->address,
            ];
        });

        $busLat = $bus?->latitude ? (float) $bus->latitude : $schoolLat;
        $busLng = $bus?->longitude ? (float) $bus->longitude : $schoolLng;

        return [
            'id' => $trip->id,
            'type' => $trip->type,
            'status' => $trip->status,
            'trip_date' => $trip->trip_date?->format('Y-m-d') ?? date('Y-m-d'),
            'departure_time' => $trip->departure_time?->format('H:i'),
            'arrival_time' => $trip->arrival_time?->format('H:i'),
            'actual_distance_km' => (float) $trip->actual_distance_km,
            'bus' => $bus ? [
                'id' => $bus->id,
                'bus_number' => $bus->bus_number,
                'plate_number' => $bus->plate_number,
                'capacity' => $bus->capacity,
                'latitude' => $busLat,
                'longitude' => $busLng,
                'driver_name' => $driver ? trim($driver->first_name_ar.' '.$driver->last_name_ar) : ($driver?->name ?? 'غير محدد'),
                'speed_kmh' => (float) Cache::get('bus_speed_'.$bus->id, 0),
                'heading' => (float) Cache::get('bus_heading_'.$bus->id, 0),
            ] : null,
            'school' => [
                'id' => $school?->id,
                'name' => $school?->name ?? 'المدرسة',
                'lat' => $schoolLat,
                'lng' => $schoolLng,
            ],
            'route' => $trip->route ? [
                'id' => $trip->route->id,
                'name' => $trip->route->name,
                'estimated_distance_km' => (float) $trip->route->estimated_distance_km,
            ] : null,
            'students' => $students,
            'stats' => [
                'total_students' => $students->count(),
                'boarded_count' => $students->where('status', 'boarded')->count(),
                'dropped_count' => $students->where('status', 'dropped')->count(),
                'absent_count' => $students->where('status', 'absent')->count(),
                'pending_count' => $students->where('status', 'pending')->count(),
                'total_wait_minutes' => (int) $students->sum('extra_wait_time'),
            ],
        ];
    }
}
