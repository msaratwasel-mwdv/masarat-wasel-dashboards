<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\FieldTrip;
use App\Models\Bus;
use App\Models\Route;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class TripDashboardController extends Controller
{
    public function __construct(protected \App\Services\TripService $tripService) {}

    public function index(Request $request)
    {
        $schoolId = Auth::user()->getSchoolId();
        $today = Carbon::today()->toDateString();
        $date = $request->input('date', $today);
        $routeId = $request->input('route_id');

        // Fetch today's trips first to sync them
        $rawTrips = Trip::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->whereDate('trip_date', $date)
            ->get();

        foreach ($rawTrips as $t) {
            $this->tripService->syncTripAttendances($t);
        }

        // Fetch today's trips
        $query = Trip::whereHas('bus', fn($q) => $q->where('school_id', $schoolId))
            ->whereDate('trip_date', $date)
            ->with(['bus.driver.user', 'bus.assistant', 'bus.route', 'attendances.student'])
            ->withCount('attendances');

        if ($routeId) {
            $query->whereHas('bus', fn($q) => $q->where('route_id', $routeId));
        }

        $dailyTrips = $query->get();

        // Fetch active field trips
        $activeFieldTrips = FieldTrip::where('school_id', $schoolId)
            ->whereIn('status', ['approved', 'in_progress'])
            ->with(['bus.driver.user', 'bus.assistant'])
            ->get();

        // Fetch routes with details for the Routes tab
        $routes = Route::where('school_id', $schoolId)
            ->with(['buses.driver', 'buses.assistant'])
            ->withCount(['morningStudents', 'afternoonStudents'])
            ->get();

        $buses = Bus::where('school_id', $schoolId)
            ->with(['driver', 'assistant', 'route'])
            ->get();

        // Stats
        $stats = [
            'total_trips' => $dailyTrips->count(),
            'finished' => $dailyTrips->where('status', 'finished')->count(),
            'in_progress' => $dailyTrips->where('status', 'in_progress')->count() + $activeFieldTrips->where('status', 'in_progress')->count(),
            'total_routes' => $routes->count(),
            'active_buses' => $buses->where('status', 'active')->count(),
            'pending_field_trips' => $activeFieldTrips->where('status', 'approved')->count(),
        ];

        return Inertia::render('School/Trips/Dashboard', [
            'dailyTrips' => $dailyTrips,
            'fieldTrips' => $activeFieldTrips,
            'buses' => $buses,
            'routes' => $routes,
            'stats' => $stats,
            'filters' => [
                'date' => $date,
                'route_id' => $routeId,
            ],
        ]);
    }

    public function show(Trip $trip)
    {
        $schoolId = Auth::user()->getSchoolId();
        if (!$trip->bus || $trip->bus->school_id !== $schoolId) {
            abort(403);
        }

        $this->tripService->syncTripAttendances($trip);

        $trip->load(['bus.driver.user', 'bus.assistant', 'route', 'attendances.student']);

        return Inertia::render('School/Trips/TripDetails', [
            'trip' => $trip
        ]);
    }
}


