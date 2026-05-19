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
            ->with(['roles', 'driver', 'assignedBus.school']);

        if ($statusFilter === 'assigned') {
            $query->whereHas('assignedBus');
        } elseif ($statusFilter === 'available') {
            $query->whereDoesntHave('assignedBus');
        }

        $paginated = $this->applyDataTable($query, $request, [
            'name',
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

        $counts = \Illuminate\Support\Facades\Cache::remember('driver_counts', 600, function() {
            $driverUserIds = DB::table('user_roles')
                ->join('roles', 'user_roles.role_id', '=', 'roles.id')
                ->where('roles.name', 'driver')
                ->pluck('user_roles.user_id');

            $assignedCount = DB::table('buses')
                ->whereIn('driver_id', $driverUserIds)
                ->whereNull('deleted_at')
                ->distinct('driver_id')
                ->count('driver_id');

            $totalCount = $driverUserIds->count();

            return [
                'all' => $totalCount,
                'assigned' => $assignedCount,
                'available' => $totalCount - $assignedCount,
            ];
        });

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
            'first_name_ar' => 'required_without:first_name_en|nullable|string|max:255',
            'last_name_ar' => 'required_with:first_name_ar|nullable|string|max:255',
            'first_name_en' => 'required_without:first_name_ar|nullable|string|max:255',
            'last_name_en' => 'required_with:first_name_en|nullable|string|max:255',
            'national_id' => 'required|numeric|unique:users,national_id',
            'email' => 'nullable|email|unique:users,email',
            'phone' => 'required|unique:users,phone',
            'license_number' => 'required|unique:drivers,license_number',
            'license_expiry_date' => 'required|date|after:today',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'license_front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'license_back_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'id_card_front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'id_card_back_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'address' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($request) {
            $user = User::create([
                'first_name_ar' => $request->first_name_ar,
                'last_name_ar' => $request->last_name_ar,
                'first_name_en' => $request->first_name_en ?? '',
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
                'id_card_front_image' => $request->hasFile('id_card_front_image') ? $request->file('id_card_front_image')->store('drivers/id_cards', 'public') : null,
                'id_card_back_image' => $request->hasFile('id_card_back_image') ? $request->file('id_card_back_image')->store('drivers/id_cards', 'public') : null,
                'status' => 'active',
            ]);
        });

        return redirect()->back()->with('success', 'Driver registered successfully');
    }

    // --- 3. التعديل (UPDATE) ---
    public function updateDriver(Request $request, User $driver)
    {
        $request->validate([
            'first_name_ar' => 'required_without:first_name_en|nullable|string|max:255',
            'last_name_ar' => 'required_with:first_name_ar|nullable|string|max:255',
            'first_name_en' => 'required_without:first_name_ar|nullable|string|max:255',
            'last_name_en' => 'required_with:first_name_en|nullable|string|max:255',
            // نستخدم ignore لتجاهل السائق الحالي عند التحقق من التكرار
            'national_id' => ['required', 'numeric', Rule::unique('users')->ignore($driver->id)],
            'email' => ['required', 'email', Rule::unique('users')->ignore($driver->id)],
            'phone' => ['required', Rule::unique('users')->ignore($driver->id)],
            'license_number' => ['required', Rule::unique('drivers', 'license_number')->ignore($driver->id, 'user_id')],
            'license_expiry_date' => 'required|date',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'license_front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'license_back_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'id_card_front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'id_card_back_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'address' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($request, $driver) {
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

            // Update extension record in drivers table
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

    // --- 4. الحذف (DELETE) ---
    public function destroyDriver(User $driver)
    {
        // الحذف الناعم (Soft Delete) مفعل في المودل
        $driver->delete();

        return redirect()->back()->with('success', 'Driver deleted successfully');
    }

    // --- 5. طباعة البطاقة (PRINT) ---
    public function printCard(User $driver)
    {
        $driver->load(['driver', 'assignedBus.school']);

        return Inertia::render('Admin/Drivers/PrintCard', [
            'driver' => $driver
        ]);
    }

    // --- 6. التصدير والاستيراد (Export & Import) ---
    public function export()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\DriversExport(false), 'drivers.xlsx');
    }

    public function downloadTemplate()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\DriversExport(true), 'drivers_template.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
        ]);

        $import = new \App\Imports\DriversImport();

        try {
            \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));
        } catch (\Throwable $e) {
            // General extreme failure (e.g., corrupt file structure)
            $errorMsg = "فشل في معالجة ملف الاستيراد: " . $e->getMessage() . " / Excel Import file processing failed: " . $e->getMessage();
            return redirect()->back()->with('import_errors', [$errorMsg]);
        }

        $errorsArray = [];

        // 1. validation failures skipped per row
        if ($import->failures()->isNotEmpty()) {
            $customAttributes = (new \App\Imports\DriversImport())->customValidationAttributes();
            foreach ($import->failures() as $failure) {
                $row = $failure->row();
                $attributeKey = $failure->attribute(); // This might be the translated string because of customValidationAttributes

                // If it's already translated, reverse map it to get the original index (e.g., '4')
                $originalKey = array_search($attributeKey, $customAttributes);
                if ($originalKey === false) {
                    $originalKey = $attributeKey; // Fallback if it wasn't translated
                    $columnName = $customAttributes[$attributeKey] ?? $attributeKey;
                } else {
                    $columnName = $attributeKey;
                }

                $badValue = $failure->values()[$originalKey] ?? 'فارغة (Empty)';
                if (is_scalar($badValue) && trim((string)$badValue) === '') $badValue = 'فارغة (Empty)';
                if ($badValue === null) $badValue = 'فارغة (Empty)';

                $errors = implode(' | ', $failure->errors());

                $errorsArray[] = "السطر {$row} | العمود: [{$columnName}] | القيمة المدخلة: ({$badValue}) | الخطأ: {$errors}";
            }
        }

        // 2. database or PHP exceptions skipped per row
        if ($import->errors()->isNotEmpty()) {
            foreach ($import->errors() as $error) {
                $msg = $error->getMessage();
                if (str_contains($msg, 'Duplicate entry') && str_contains($msg, 'users_email_unique')) {
                    $errorsArray[] = "خطأ قاعدة بيانات: البريد الإلكتروني مكرر ومسجل مسبقاً لدى مستخدم آخر / Database Error: Email address is already taken by another user.";
                } else {
                    $errorsArray[] = "السطر خطأ: " . $msg . " / Skipped row processing error: " . $msg;
                }
            }
        }

        // If there are failures, flash them to Inertia
        if (!empty($errorsArray)) {
            $msg = "تم استيراد {$import->successCount} سائق بنجاح. وتم تخطي بعض الأسطر بسبب وجود أخطاء.";
            return redirect()->back()
                ->with('success', $msg)
                ->with('import_errors', $errorsArray);
        }

        return redirect()->back()->with('success', "تم استيراد {$import->successCount} سائق بنجاح وتحديث القائمة.");
    }

    public function printAll(Request $request)
    {
        $statusFilter = $request->input('status', 'all');
        $search = $request->input('search');

        $query = User::whereHas('roles', fn($q) => $q->where('name', 'driver'))
            ->with(['roles', 'driver', 'assignedBus.school']);

        if ($statusFilter === 'assigned') {
            $query->whereHas('assignedBus');
        } elseif ($statusFilter === 'available') {
            $query->whereDoesntHave('assignedBus');
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name_ar', 'like', "%{$search}%")
                  ->orWhere('last_name_ar', 'like', "%{$search}%")
                  ->orWhere('first_name_en', 'like', "%{$search}%")
                  ->orWhere('last_name_en', 'like', "%{$search}%")
                  ->orWhere('national_id', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Apply sorting if passed (TanStack Sync)
        $sortColumn = $request->input('sort');
        $sortDirection = $request->input('direction', 'desc');
        if ($sortColumn && in_array($sortDirection, ['asc', 'desc'])) {
            if ($sortColumn === 'name') {
                $query->orderBy('first_name_ar', $sortDirection)
                      ->orderBy('last_name_ar', $sortDirection);
            } elseif ($sortColumn === 'national_id') {
                $query->orderBy('national_id', $sortDirection);
            } else {
                $query->orderBy($sortColumn, $sortDirection);
            }
        } else {
            $query->latest();
        }

        $drivers = $query->get()->map(function($driver) {
            return [
                'id' => $driver->id,
                'name' => $driver->name,
                'name_en' => $driver->name_en,
                'first_name_ar' => $driver->first_name_ar,
                'last_name_ar' => $driver->last_name_ar,
                'first_name_en' => $driver->first_name_en,
                'last_name_en' => $driver->last_name_en,
                'national_id' => $driver->national_id,
                'phone' => $driver->phone,
                'email' => $driver->email,
                'address' => $driver->address,
                'preferred_language' => $driver->preferred_language,
                'driver' => $driver->driver ? [
                    'license_number' => $driver->driver->license_number,
                    'license_expiry_date' => $driver->driver->license_expiry_date,
                ] : null,
                'assigned_bus' => $driver->assignedBus ? [
                    'bus_number' => $driver->assignedBus->bus_number,
                ] : null,
            ];
        });
        $userLang = $request->input('lang') ?? auth()->user()->preferred_language ?? 'ar';
        $isRTL = $userLang === 'ar';

        return Inertia::render('Print/SharedPrintReport', [
            'title_ar' => 'تقرير بيانات السائقين',
            'title_en' => 'Drivers Operational Report',
            'subtitle_ar' => 'إدارة شركة مسارات واصل',
            'subtitle_en' => 'Masarat Wasel Company',
            'totalLabel_ar' => 'إجمالي الكادر',
            'totalLabel_en' => 'Total Force',
            'columns' => [
                ['key' => 'name', 'label_ar' => 'السائق', 'label_en' => 'Driver', 'bold' => true],
                ['key' => 'national_id', 'label_ar' => 'الرقم المدني', 'label_en' => 'Civil ID', 'mono' => true],
                ['key' => 'phone', 'label_ar' => 'الجوال', 'label_en' => 'Phone'],
                ['key' => 'driver.license_number', 'label_ar' => 'رقم الرخصة', 'label_en' => 'License'],
                ['key' => 'driver.license_expiry_date', 'label_ar' => 'تاريخ الانتهاء', 'label_en' => 'Expiry'],
                ['key' => 'assigned_bus.bus_number', 'label_ar' => 'الباص/الحافلة', 'label_en' => 'Bus/Coach'],
                ['key' => 'preferred_language', 'label_ar' => 'اللغة', 'label_en' => 'Language'],
            ],
            'data' => $drivers,
            'printDate' => now()->format('Y-m-d H:i:s'),
            'isRTL' => $isRTL,
        ]);
    }
}
