<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\Bus;
use App\Models\Route;
use App\Services\TripService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\App;
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
            ->orderByDesc('trip_date')
            ->orderByDesc('id');

        // Optional date filter
        if ($request->filled('date')) {
            $query->whereDate('trip_date', $request->date);
        }

        // Optional status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $trips = $query->paginate(50)->withQueryString();
        $buses = Bus::with(['driver.user', 'assistant'])->get();
        $routes = Route::all();

        return Inertia::render('Admin/DailyTrips/Index', [
            'trips'   => $trips,
            'filters' => $request->only('date', 'status'),
            'buses'   => $buses,
            'routes'  => $routes,
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
        Log::info('[DailyTrips] Manual creation attempt', $request->all());
        $request->validate([
            'bus_id'   => 'required|exists:buses,id',
            'route_id' => 'required|exists:routes,id',
            'type'     => 'required|in:forth,back,both',
            'date'     => 'required|date_format:Y-m-d',
        ]);

        $bus = Bus::findOrFail($request->bus_id);
        $date = Carbon::createFromFormat('Y-m-d', $request->date)->startOfDay();

        $types = $request->type === 'both' ? ['forth', 'back'] : [$request->type];
        $createdCount = 0;
        $errors = [];

        foreach ($types as $type) {
            [$trip, $reason] = $this->tripService->createDailyTrip($bus, $type, $date);
            if ($trip) {
                $createdCount++;
            } else {
                $errors[] = ($type === 'forth' ? 'ذهاب: ' : 'إياب: ') . str_replace('_', ' ', $reason);
            }
        }

        if ($createdCount === 0) {
            Log::warning('[DailyTrips] Manual creation failed', ['reasons' => $errors, 'bus' => $bus->id]);
            return back()->with('error', "Could not create trip: " . implode(', ', $errors));
        }

        $message = $createdCount === 2 
            ? 'تم إنشاء رحلتي الذهاب والإياب بنجاح.' 
            : 'تم إنشاء الرحلة بنجاح.';
        
        if (count($errors) > 0) {
            $message .= " (ملاحظة: " . implode(', ', $errors) . ")";
        }

        return redirect()->route('admin.daily-trips.index')->with('success', $message);
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

        $trip->bus->update(['trip_status' => 'in_progress']);

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
            'status'       => 'required|in:pending,in_progress,completed,cancelled,awaiting_confirmation',
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
        $this->tripService->syncTripAttendances($trip);
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

        if (isset($result['status']) && $result['status'] === 'skipped') {
            $reason = App::getLocale() === 'ar' ? ($result['reason_ar'] ?? $result['reason']) : ($result['reason'] ?? 'No schools are active for this date.');
            return back()->with('error', $reason);
        }

        $message = "Auto-creation complete: {$result['created']} trips created, {$result['skipped']} skipped.";
        return back()->with('success', $message);
    }

    /**
     * Validate a date for auto-creation.
     */
    public function validateDate(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $date = Carbon::parse($request->date);
        $result = $this->tripService->validateTargetDate($date);

        return response()->json($result);
    }
}


