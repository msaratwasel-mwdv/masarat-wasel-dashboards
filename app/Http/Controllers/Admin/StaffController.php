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
    use \App\Traits\DataTableTrait;

    // --- 1. عرض القائمة (READ) ---
    public function index(Request $request)
    {
        $statusFilter = $request->input('status', 'all');

        $query = User::where('role', 'driver')
            ->with(['driverProfile', 'assignedBus.school']);

        if ($statusFilter === 'assigned') {
            $query->whereHas('assignedBus');
        } elseif ($statusFilter === 'available') {
            $query->whereDoesntHave('assignedBus');
        }

        $paginated = $this->applyDataTable($query, $request, [
            'name',
            'name_en',
            'national_id',
            'phone',
            'email',
            'user_code',
            'driverProfile.license_number',
        ], 15, function($driver) {
            return [
                'الاسم' => $driver->name,
                'الاسم (EN)' => $driver->name_en,
                'الكود' => $driver->user_code,
                'الهوية' => $driver->national_id,
                'رقم الجوال' => $driver->phone,
                'البريد الإلكتروني' => $driver->email,
                'رقم الرخصة' => $driver->driverProfile ? $driver->driverProfile->license_number : 'غير محدد',
                'تاريخ انتهاء الرخصة' => $driver->driverProfile ? $driver->driverProfile->license_expiry_date : 'غير محدد',
                'الباص المعين' => $driver->assignedBus ? $driver->assignedBus->bus_code : 'متاح',
                'حالة السائق' => $driver->driverProfile 
                    ? match($driver->driverProfile->status) {
                        'active' => 'نشط',
                        'inactive' => 'غير نشط',
                        'pending' => 'قيد المراجعة',
                        default => $driver->driverProfile->status
                    } 
                    : 'نشط',
            ];
        });

        if ($paginated instanceof \Symfony\Component\HttpFoundation\Response) {
            return $paginated;
        }

        $counts = [
            'all' => User::where('role', 'driver')->count(),
            'assigned' => User::where('role', 'driver')->whereHas('assignedBus')->count(),
            'available' => User::where('role', 'driver')->whereDoesntHave('assignedBus')->count(),
        ];

        return Inertia::render('Admin/Drivers/Index', [
            'drivers' => $paginated,
            'counts'  => $counts,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $statusFilter,
            ]
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
