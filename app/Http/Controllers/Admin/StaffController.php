<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    // --- 1. عرض القائمة (READ) ---
    public function index()
    {
        // جلب السائقين التابعين للشركة (school_id = null)
        // مع بيانات البروفايل الخاص بهم
        $drivers = User::where('role', 'driver')
            ->whereNull('school_id') // أو حسب منطقك إذا كانوا مرتبطين بمدرسة
            ->with('driverProfile')
            ->latest()
            ->get();

        return Inertia::render('Admin/Drivers/Index', [
            'drivers' => $drivers
        ]);
    }

    // --- 2. الحفظ (CREATE) ---
    public function storeDriver(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'national_id' => 'required|numeric|unique:users,national_id',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|unique:users,phone',
            'license_number' => 'required|unique:driver_profiles,license_number',
            'license_expiry_date' => 'required|date|after:today',
        ]);

        DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'national_id' => $request->national_id,
                'password' => Hash::make($request->phone),
                'role' => 'driver',
                'school_id' => null, // يتبع الشركة
                'user_code' => 'DRV-' . rand(10000, 99999),
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
            // نستخدم ignore لتجاهل السائق الحالي عند التحقق من التكرار
            'national_id' => ['required', 'numeric', Rule::unique('users')->ignore($driver->id)],
            'email' => ['required', 'email', Rule::unique('users')->ignore($driver->id)],
            'phone' => ['required', Rule::unique('users')->ignore($driver->id)],
            // التحقق من جدول البروفايل
            'license_number' => ['required', Rule::unique('driver_profiles')->ignore($driver->driverProfile->id ?? 0)],
            'license_expiry_date' => 'required|date',
        ]);

        DB::transaction(function () use ($request, $driver) {
            // تحديث البيانات الأساسية
            $driver->update([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'national_id' => $request->national_id,
            ]);

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
