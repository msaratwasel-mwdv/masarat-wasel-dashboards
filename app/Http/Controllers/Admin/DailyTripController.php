<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DailyTripController extends Controller
{
    /**
     * Display all auto-generated daily trips (forth & back).
     */
    public function index(Request $request)
    {
        $query = Trip::with(['bus.driver', 'bus.route', 'driver', 'assistant'])
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
}
