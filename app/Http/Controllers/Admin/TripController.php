<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Trip;
use Inertia\Inertia;

class TripController extends Controller
{
    public function index(Request $request)
    {
        $query = Trip::with(['bus', 'bus.school'])
            ->whereNotNull('video_path')
            ->orderBy('created_at', 'desc');

        // Optional filtering
        if ($request->has('bus_id')) {
            $query->where('bus_id', $request->bus_id);
        }

        if ($request->has('date')) {
            $query->whereDate('trip_date', $request->date);
        }

        $trips = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/Trips/Index', [
            'trips' => $trips,
            'filters' => $request->only(['bus_id', 'date']),
        ]);
    }
}
