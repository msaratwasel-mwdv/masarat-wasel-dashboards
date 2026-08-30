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

        $drivers = User::whereHas('roles', fn ($q) => $q->where('name', 'driver'))
            ->whereHas('assignedBus', fn ($q) => $q->where('school_id', $schoolId))
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
                    'first_name_ar' => $driver->first_name_ar,
                    'last_name_ar' => $driver->last_name_ar,
                    'first_name_en' => $driver->first_name_en,
                    'last_name_en' => $driver->last_name_en,
                    'address' => $driver->address,
                    'license_front_image' => $driver->driver?->license_front_image,
                    'license_back_image' => $driver->driver?->license_back_image,
                    'id_card_front_image' => $driver->driver?->id_card_front_image,
                    'id_card_back_image' => $driver->driver?->id_card_back_image,
                    'driver' => $driver->driver,
                ];
            });

        return Inertia::render('School/Drivers/Index', [
            'drivers' => $drivers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function update(Request $request, User $driver)
    {
        $schoolId = Auth::user()->school_id;
        $isAssigned = $driver->assignedBus()->where('school_id', $schoolId)->exists();
        if (! $isAssigned) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'first_name_ar' => 'required_without:first_name_en|nullable|string|max:255',
            'last_name_ar' => 'required_with:first_name_ar|nullable|string|max:255',
            'first_name_en' => 'required_without:first_name_ar|nullable|string|max:255',
            'last_name_en' => 'required_with:first_name_en|nullable|string|max:255',
            'national_id' => ['required', 'numeric', \Illuminate\Validation\Rule::unique('users')->ignore($driver->id)],
            'email' => ['required', 'email', \Illuminate\Validation\Rule::unique('users')->ignore($driver->id)],
            'phone' => ['required', \Illuminate\Validation\Rule::unique('users')->ignore($driver->id)],
            'license_number' => ['required', \Illuminate\Validation\Rule::unique('drivers', 'license_number')->ignore($driver->id, 'user_id')],
            'license_expiry_date' => 'required|date',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'license_front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'license_back_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'id_card_front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'id_card_back_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'address' => 'nullable|string|max:500',
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $driver) {
            $updateData = [
                'first_name_ar' => $request->first_name_ar,
                'last_name_ar' => $request->last_name_ar,
                'first_name_en' => $request->first_name_en ?? '',
                'last_name_en' => $request->last_name_en ?? '',
                'national_id' => $request->national_id,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
            ];

            if ($request->remove_image) {
                if ($driver->image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($driver->image);
                }
                $updateData['image'] = null;
            } elseif ($request->hasFile('image')) {
                if ($driver->image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($driver->image);
                }
                $updateData['image'] = $request->file('image')->store('avatars', 'public');
            }

            $driver->update($updateData);

            $driver_ext = $driver->driver()->firstOrCreate(['user_id' => $driver->id]);

            $driverExtData = [
                'license_number' => $request->license_number,
                'license_expiry_date' => $request->license_expiry_date,
                'status' => strtolower($request->status ?? 'active'),
            ];

            if ($request->remove_license_front_image) {
                if ($driver_ext->license_front_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($driver_ext->license_front_image);
                }
                $driverExtData['license_front_image'] = null;
            } elseif ($request->hasFile('license_front_image')) {
                if ($driver_ext->license_front_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($driver_ext->license_front_image);
                }
                $driverExtData['license_front_image'] = $request->file('license_front_image')->store('drivers/licenses', 'public');
            }

            if ($request->remove_license_back_image) {
                if ($driver_ext->license_back_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($driver_ext->license_back_image);
                }
                $driverExtData['license_back_image'] = null;
            } elseif ($request->hasFile('license_back_image')) {
                if ($driver_ext->license_back_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($driver_ext->license_back_image);
                }
                $driverExtData['license_back_image'] = $request->file('license_back_image')->store('drivers/licenses', 'public');
            }

            if ($request->remove_id_card_front_image) {
                if ($driver_ext->id_card_front_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($driver_ext->id_card_front_image);
                }
                $driverExtData['id_card_front_image'] = null;
            } elseif ($request->hasFile('id_card_front_image')) {
                if ($driver_ext->id_card_front_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($driver_ext->id_card_front_image);
                }
                $driverExtData['id_card_front_image'] = $request->file('id_card_front_image')->store('drivers/id_cards', 'public');
            }

            if ($request->remove_id_card_back_image) {
                if ($driver_ext->id_card_back_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($driver_ext->id_card_back_image);
                }
                $driverExtData['id_card_back_image'] = null;
            } elseif ($request->hasFile('id_card_back_image')) {
                if ($driver_ext->id_card_back_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($driver_ext->id_card_back_image);
                }
                $driverExtData['id_card_back_image'] = $request->file('id_card_back_image')->store('drivers/id_cards', 'public');
            }

            $driver_ext->update($driverExtData);
        });

        return redirect()->back()->with('success', 'Driver information updated successfully');
    }
}
