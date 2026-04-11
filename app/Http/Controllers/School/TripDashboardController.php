<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\FieldTrip;
use App\Models\Bus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class TripDashboardController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = Auth::user()->getSchoolId();
        $today = Carbon::today()->toDateString();
        $date = $request->input('date', $today);

        // Fetch today's regular trips
        $dailyTrips = Trip::where('school_id', $schoolId)
            ->whereDate('trip_date', $date)
            ->with(['bus.driver', 'bus.assistant', 'route'])
            ->withCount('attendances')
            ->get();

        // Fetch active field trips
        $activeFieldTrips = FieldTrip::where('school_id', $schoolId)
            ->whereIn('status', ['approved', 'started'])
            ->with(['bus.driver', 'bus.assistant'])
            ->get();

        // Fetch buses with location data for the map
        $buses = Bus::where('school_id', $schoolId)
            ->with(['driver', 'assistant'])
            ->get()
            ->map(function ($bus) use ($dailyTrips) {
                $currentTrip = $dailyTrips->where('bus_id', $bus->id)->first();
                $bus->trip_status = $currentTrip ? $currentTrip->status : null;
                return $bus;
            });

        // Stats
        $stats = [
            'total_trips' => $dailyTrips->count(),
            'completed' => $dailyTrips->where('status', 'completed')->count(),
            'on_route' => $dailyTrips->where('status', 'on_route')->count() + $activeFieldTrips->where('status', 'started')->count(),
            'total_buses' => $buses->count(),
            'active_buses' => $buses->where('status', 'active')->count(),
            'pending_field_trips' => FieldTrip::where('school_id', $schoolId)->where('status', 'pending')->count(),
        ];

        return Inertia::render('School/Trips/Dashboard', [
            'dailyTrips' => $dailyTrips,
            'fieldTrips' => $activeFieldTrips,
            'buses' => $buses,
            'stats' => $stats,
            'filters' => [
                'date' => $date,
            ],
        ]);
    }

    public function show(Trip $trip)
    {
        $schoolId = Auth::user()->getSchoolId();
        if ($trip->school_id !== $schoolId) {
            abort(403);
        }

        $trip->load(['bus.driver', 'bus.assistant', 'route', 'attendances.student']);

        return Inertia::render('School/Trips/TripDetails', [
            'trip' => $trip
        ]);
    }
}


