<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\Bus;
use App\Models\Route;
use App\Services\TripService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DailyTripController extends Controller
{
    public function __construct(protected TripService $tripService) {}
    /**
     * Display all auto-generated daily trips (forth & back).
     */
    public function index(Request $request)
    {
        $query = Trip::with(['bus'])
            ->whereIn('type', ['forth', 'back'])
            ->orderByDesc('departure_time');

        // Optional date filter
        if ($request->filled('date')) {
            $query->whereDate('departure_time', $request->date);
        }

        // Optional status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $trips = $query->paginate(50)->withQueryString();

        return Inertia::render('Admin/DailyTrips/Index', [
            'trips'   => $trips,
            'filters' => $request->only('date', 'status'),
        ]);
    }

    /**
     * Show the form for creating a new daily trip.
     */
    public function create()
    {
        // Show all buses so the admin can select them and see specific error messages if data is missing
        $buses = Bus::with(['driver.user', 'assistant'])->get();
        $routes = Route::all();

        return Inertia::render('Admin/DailyTrips/Create', [
            'buses' => $buses,
            'routes' => $routes,
        ]);
    }

    /**
     * Store a manually created daily trip.
     */
    public function store(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('[DailyTrips] Manual creation attempt', $request->all());
        $request->validate([
            'bus_id'   => 'required|exists:buses,id',
            'route_id' => 'required|exists:routes,id',
            'type'     => 'required|in:forth,back',
            'date'     => 'required|date',
        ]);

        $bus = Bus::findOrFail($request->bus_id);
        $date = Carbon::parse($request->date);

        [$trip, $reason] = $this->tripService->createDailyTrip($bus, $request->type, $date, (int)$request->route_id);

        if (!$trip) {
            \Illuminate\Support\Facades\Log::warning('[DailyTrips] Manual creation failed', ['reason' => $reason, 'bus' => $bus->id]);
            return back()->with('error', "Could not create trip: " . str_replace('_', ' ', $reason));
        }

        return redirect()->route('admin.daily-trips.index')->with('success', 'Daily trip created successfully.');
    }

    /**
     * Show the form for editing the specified daily trip.
     */
    public function edit(Trip $trip)
    {
        $trip->load(['bus', 'driver', 'assistant']);
        $buses = Bus::with(['driver.user', 'assistant'])->get();
        $routes = Route::all();

        return Inertia::render('Admin/DailyTrips/Edit', [
            'trip'  => $trip,
            'buses' => $buses,
            'routes' => $routes,
        ]);
    }

    /**
     * Confirm a trip manually from admin panel
     */
    public function confirm(Request $request, Trip $trip)
    {
        if ($trip->status !== 'awaiting_confirmation') {
            return back()->with('error', 'هذه الرحلة لا تنتظر التأكيد.');
        }

        $trip->update([
            'status' => 'in_progress',
            'departure_time' => now(),
        ]);

        return redirect()->route('admin.daily-trips.show', $trip->id)->with('success', 'تم تأكيد الرحلة بنجاح وبدأت الآن.');
    }

    /**
     * Update the specified daily trip.
     */
    public function update(Request $request, Trip $trip)
    {
        $validated = $request->validate([
            'route_id'     => 'required|exists:routes,id',
            'driver_id'    => 'nullable|exists:users,id',
            'assistant_id' => 'nullable|exists:users,id',
            'status'       => 'required|in:pending,ongoing,completed,cancelled',
            'departure_time' => 'required|date',
            'arrival_time'   => 'nullable|date',
        ]);

        $trip->update($validated);

        return redirect()->route('admin.daily-trips.index')->with('success', 'Trip updated successfully.');
    }

    /**
     * Remove the specified daily trip.
     */
    public function destroy(Trip $trip)
    {
        $trip->delete();

        return redirect()->route('admin.daily-trips.index')->with('success', 'Trip deleted successfully.');
    }

    /**
     * Show the detailed view of a specific daily trip.
     */
    public function show(Trip $trip)
    {
        $trip->load(['bus.school', 'bus.driver.user', 'driver', 'assistant', 'bus.route', 'attendances.student']);

        return Inertia::render('Admin/DailyTrips/Show', [
            'trip' => $trip,
        ]);
    }

    /**
     * Trigger auto-creation of trips for a specific date.
     */
    public function autoCreate(Request $request)
    {
        $request->validate([
            'date' => 'nullable|date',
        ]);

        $date = $request->filled('date') ? Carbon::parse($request->date) : null;
        $result = $this->tripService->autoCreateDailyTrips($date);

        return back()->with('success', "Auto-creation complete: {$result['created']} trips created, {$result['skipped']} skipped.");
    }
}


