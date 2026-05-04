<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DriverController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = Auth::user()->school_id;
        $search = $request->input('search');

        $drivers = User::whereHas('roles', fn($q) => $q->where('name', 'driver'))
            ->whereHas('assignedBus', fn($q) => $q->where('school_id', $schoolId))
            ->with(['driver', 'assignedBus'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name_ar', 'like', "%{$search}%")
                        ->orWhere('last_name_ar', 'like', "%{$search}%")
                        ->orWhere('national_id', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->get()
            ->map(function ($driver) {
                return [
                    'id' => $driver->id,
                    'name' => $driver->name,
                    'name_en' => $driver->name_en,
                    'national_id' => $driver->national_id,
                    'phone' => $driver->phone,
                    'email' => $driver->email,
                    'license_number' => $driver->driver?->license_number,
                    'license_expiry_date' => $driver->driver?->license_expiry_date,
                    'status' => $driver->driver?->status,
                    'bus_number' => $driver->assignedBus?->bus_number,
                    'plate_number' => $driver->assignedBus?->plate_number,
                    'image' => $driver->image,
                ];
            });

        return Inertia::render('School/Drivers/Index', [
            'drivers' => $drivers,
            'filters' => $request->only(['search']),
        ]);
    }
}
