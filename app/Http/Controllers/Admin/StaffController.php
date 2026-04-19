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

        $query = User::whereHas('roles', fn($q) => $q->where('name', 'driver'))
            ->with(['driver', 'assignedBus.school']);

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
        ], 15, function($driver) {
            return [
                'id' => $driver->id,
                'الاسم' => $driver->name,
                'الاسم (EN)' => $driver->name_en,
                'الهوية' => $driver->national_id,
                'رقم الجوال' => $driver->phone,
                'البريد الإلكتروني' => $driver->email,
                'رقم الرخصة' => $driver->driver?->license_number ?? 'غير محدد',
                'تاريخ انتهاء الرخصة' => $driver->driver?->license_expiry_date ?? 'غير محدد',
                'الباص المعين' => $driver->assignedBus?->bus_number ?? 'متاح',
                'حالة السائق' => match($driver->driver?->status ?? '') {
                    'active' => 'نشط',
                    'inactive' => 'غير نشط',
                    default => $driver->driver?->status ?? 'نشط',
                },
                'license_front_image' => $driver->driver?->license_front_image,
                'license_back_image' => $driver->driver?->license_back_image,
            ];
        });

        if ($paginated instanceof \Symfony\Component\HttpFoundation\Response) {
            return $paginated;
        }

        $counts = [
            'all' => User::whereHas('roles', fn($q) => $q->where('name', 'driver'))->count(),
            'assigned' => User::whereHas('roles', fn($q) => $q->where('name', 'driver'))->whereHas('assignedBus')->count(),
            'available' => User::whereHas('roles', fn($q) => $q->where('name', 'driver'))->whereDoesntHave('assignedBus')->count(),
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
            'first_name_ar' => 'required|string|max:255',
            'second_name_ar' => 'nullable|string|max:255',
            'third_name_ar' => 'nullable|string|max:255',
            'last_name_ar' => 'required|string|max:255',
            'first_name_en' => 'nullable|string|max:255',
            'second_name_en' => 'nullable|string|max:255',
            'third_name_en' => 'nullable|string|max:255',
            'last_name_en' => 'nullable|string|max:255',
            'national_id' => 'required|numeric|unique:users,national_id',
            'email' => 'nullable|email|unique:users,email',
            'phone' => 'required|unique:users,phone',
            'license_number' => 'required|unique:drivers,license_number',
            'license_expiry_date' => 'required|date|after:today',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'license_front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'license_back_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'address' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($request) {
            $user = User::create([
                'first_name_ar' => $request->first_name_ar,
                'second_name_ar' => $request->second_name_ar ?? '',
                'third_name_ar' => $request->third_name_ar ?? '',
                'last_name_ar' => $request->last_name_ar,
                'first_name_en' => $request->first_name_en ?? '',
                'second_name_en' => $request->second_name_en ?? '',
                'third_name_en' => $request->third_name_en ?? '',
                'last_name_en' => $request->last_name_en ?? '',
                'email' => $request->email,
                'phone' => $request->phone,
                'national_id' => $request->national_id,
                'password' => Hash::make($request->phone),
                'address' => $request->address,
                'image' => $request->hasFile('image') ? $request->file('image')->store('avatars', 'public') : null,
            ]);

            // Attach role via user_roles pivot
            $driverRole = \App\Models\Role::firstOrCreate(['name' => 'driver']);
            $user->roles()->attach($driverRole->id);

            // Create extension record in drivers table
            $user->driver()->create([
                'license_number' => $request->license_number,
                'license_expiry_date' => $request->license_expiry_date,
                'license_front_image' => $request->hasFile('license_front_image') ? $request->file('license_front_image')->store('drivers/licenses', 'public') : null,
                'license_back_image' => $request->hasFile('license_back_image') ? $request->file('license_back_image')->store('drivers/licenses', 'public') : null,
                'status' => 'active',
            ]);
        });

        return redirect()->back()->with('success', 'Driver registered successfully');
    }

    // --- 3. التعديل (UPDATE) ---
    public function updateDriver(Request $request, User $driver)
    {
        $request->validate([
            'first_name_ar' => 'required|string|max:255',
            'second_name_ar' => 'nullable|string|max:255',
            'third_name_ar' => 'nullable|string|max:255',
            'last_name_ar' => 'required|string|max:255',
            'first_name_en' => 'nullable|string|max:255',
            'second_name_en' => 'nullable|string|max:255',
            'third_name_en' => 'nullable|string|max:255',
            'last_name_en' => 'nullable|string|max:255',
            // نستخدم ignore لتجاهل السائق الحالي عند التحقق من التكرار
            'national_id' => ['required', 'numeric', Rule::unique('users')->ignore($driver->id)],
            'email' => ['required', 'email', Rule::unique('users')->ignore($driver->id)],
            'phone' => ['required', Rule::unique('users')->ignore($driver->id)],
            'license_number' => ['required', Rule::unique('drivers', 'license_number')->ignore($driver->id, 'user_id')],
            'license_expiry_date' => 'required|date',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'license_front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'license_back_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'address' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($request, $driver) {
            $updateData = [
                'first_name_ar' => $request->first_name_ar,
                'second_name_ar' => $request->second_name_ar ?? '',
                'third_name_ar' => $request->third_name_ar ?? '',
                'last_name_ar' => $request->last_name_ar,
                'first_name_en' => $request->first_name_en ?? '',
                'second_name_en' => $request->second_name_en ?? '',
                'third_name_en' => $request->third_name_en ?? '',
                'last_name_en' => $request->last_name_en ?? '',
                'national_id' => $request->national_id,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
            ];

            if ($request->hasFile('image')) {
                if ($driver->image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($driver->image);
                }
                $updateData['image'] = $request->file('image')->store('avatars', 'public');
            }

            $driver->update($updateData);

            // Update extension record in drivers table
            $driver_ext = $driver->driver()->firstOrCreate(['user_id' => $driver->id]);
            
            $driverExtData = [
                'license_number' => $request->license_number,
                'license_expiry_date' => $request->license_expiry_date,
                'status' => strtolower($request->status ?? 'active'),
            ];

            if ($request->hasFile('license_front_image')) {
                if ($driver_ext->license_front_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($driver_ext->license_front_image);
                }
                $driverExtData['license_front_image'] = $request->file('license_front_image')->store('drivers/licenses', 'public');
            }

            if ($request->hasFile('license_back_image')) {
                if ($driver_ext->license_back_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($driver_ext->license_back_image);
                }
                $driverExtData['license_back_image'] = $request->file('license_back_image')->store('drivers/licenses', 'public');
            }

            $driver_ext->update($driverExtData);
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


