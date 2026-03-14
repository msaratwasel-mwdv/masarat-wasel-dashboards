<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    // --- 1. عرض القائمة (READ) ---
    public function index()
    {
        // جلب جميع السائقين (سواء مرتبطين بمدرسة أو لا)
        $drivers = User::where('role', 'driver')
            ->with('driverProfile')
            ->latest()
            ->get()
            ->map(function ($driver) {
                // هل هذا السائق مُعيَّن لباص؟
                $bus = \App\Models\Bus::where('driver_id', $driver->id)
                    ->select('id', 'bus_code', 'school_id')
                    ->with('school:id,name')
                    ->first();
                $driver->assigned_bus = $bus;
                return $driver;
            });

        return Inertia::render('Admin/Drivers/Index', [
            'drivers' => $drivers
        ]);
    }

    // --- 2. الحفظ (CREATE) ---
    public function storeDriver(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'national_id' => 'required|numeric|unique:users,national_id',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|unique:users,phone',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'license_number' => 'required|unique:driver_profiles,license_number',
            'license_expiry_date' => 'required|date|after:today',
        ]);

        DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'name_en' => $request->name_en,
                'email' => $request->email,
                'phone' => $request->phone,
                'national_id' => $request->national_id,
                'password' => Hash::make($request->phone),
                'role' => 'driver',
                'school_id' => null, // يتبع الشركة
                'user_code' => 'DRV-' . rand(10000, 99999),
                'image' => $request->hasFile('image') ? $request->file('image')->store('avatars', 'public') : null,
                'is_active' => true,
            ]);

            $user->driverProfile()->create([
                'license_number' => $request->license_number,
                'license_expiry_date' => $request->license_expiry_date,
                'status' => 'Pending Training',
            ]);
        });

        return redirect()->back()->with('success', 'Driver registered successfully');
    }

    // --- 3. التعديل (UPDATE) ---
    public function updateDriver(Request $request, User $driver)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            // نستخدم ignore لتجاهل السائق الحالي عند التحقق من التكرار
            'national_id' => ['required', 'numeric', Rule::unique('users')->ignore($driver->id)],
            'email' => ['required', 'email', Rule::unique('users')->ignore($driver->id)],
            'phone' => ['required', Rule::unique('users')->ignore($driver->id)],
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            // التحقق من جدول البروفايل
            'license_number' => ['required', Rule::unique('driver_profiles')->ignore($driver->driverProfile->id ?? 0)],
            'license_expiry_date' => 'required|date',
        ]);

        DB::transaction(function () use ($request, $driver) {
            // تحديث البيانات الأساسية
            $data = [
                'name' => $request->name,
                'name_en' => $request->name_en,
                'email' => $request->email,
                'phone' => $request->phone,
                'national_id' => $request->national_id,
            ];

            if ($request->hasFile('image')) {
                if ($driver->image) {
                    Storage::disk('public')->delete($driver->image);
                }
                $data['image'] = $request->file('image')->store('avatars', 'public');
            }

            $driver->update($data);

            // تحديث البروفايل
            $driver->driverProfile()->update([
                'license_number' => $request->license_number,
                'license_expiry_date' => $request->license_expiry_date,
            ]);
        });

        return redirect()->back()->with('success', 'Driver information updated successfully');
    }

    // --- 4. الحذف (DELETE) ---
    public function destroyDriver(User $driver)
    {
        // الحذف الناعم (Soft Delete) مفعل في المودل
        $driver->delete();

        return redirect()->back()->with('success', 'Driver deleted successfully');
    }
}
