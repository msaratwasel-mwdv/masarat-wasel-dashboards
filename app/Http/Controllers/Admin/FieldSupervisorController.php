<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class FieldSupervisorController extends Controller
{
    use \App\Traits\DataTableTrait;

    public function index(Request $request)
    {
        $statusFilter = $request->input('status', 'all');

        $query = User::whereHas('roles', fn ($q) => $q->where('name', 'field_supervisor'))
            ->with(['roles', 'fieldSupervisor']);

        if ($statusFilter === 'active') {
            $query->whereHas('fieldSupervisor', fn ($q) => $q->where('status', 'active'));
        } elseif ($statusFilter === 'inactive') {
            $query->whereHas('fieldSupervisor', fn ($q) => $q->where('status', 'inactive'));
        }

        $paginated = $this->applyDataTable($query, $request, [
            'name',
            'national_id',
            'phone',
            'email',
        ], 15, function ($supervisor) {
            return [
                'الاسم' => $supervisor->name,
                'الاسم (EN)' => $supervisor->name_en,
                'الكود' => $supervisor->user_code,
                'الهوية' => $supervisor->national_id,
                'رقم الجوال' => $supervisor->phone,
                'البريد الإلكتروني' => $supervisor->email,
                'الحالة' => match ($supervisor->fieldSupervisor?->status ?? '') {
                    'active' => 'نشط',
                    'inactive' => 'غير نشط',
                    default => $supervisor->fieldSupervisor?->status ?? 'نشط',
                },
            ];
        });

        if ($paginated instanceof \Symfony\Component\HttpFoundation\Response) {
            return $paginated;
        }

        $counts = \Illuminate\Support\Facades\Cache::remember('field_supervisor_counts', 600, function () {
            $supervisorUserIds = DB::table('user_roles')
                ->join('roles', 'user_roles.role_id', '=', 'roles.id')
                ->where('roles.name', 'field_supervisor')
                ->pluck('user_roles.user_id');

            $activeCount = DB::table('field_supervisors')
                ->whereIn('user_id', $supervisorUserIds)
                ->where('status', 'active')
                ->count();

            $totalCount = $supervisorUserIds->count();

            return [
                'all' => $totalCount,
                'active' => $activeCount,
                'inactive' => $totalCount - $activeCount,
            ];
        });

        return Inertia::render('Admin/FieldSupervisors/Index', [
            'supervisors' => $paginated,
            'counts' => $counts,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $statusFilter,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name_ar' => 'required_without:first_name_en|nullable|string|max:255',
            'last_name_ar' => 'required_with:first_name_ar|nullable|string|max:255',
            'first_name_en' => 'required_without:first_name_ar|nullable|string|max:255',
            'last_name_en' => 'required_with:first_name_en|nullable|string|max:255',
            'national_id' => 'required|numeric|unique:users,national_id',
            'email' => 'nullable|email|unique:users,email',
            'phone' => 'required|unique:users,phone',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'id_card_front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'id_card_back_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'status' => 'nullable|in:active,inactive',
            'address' => 'nullable|string|max:500',
            'preferred_language' => 'nullable|in:ar,en',
        ]);

        DB::transaction(function () use ($request) {
            $user = User::create([
                'first_name_ar' => $request->first_name_ar ?? '',
                'last_name_ar' => $request->last_name_ar ?? '',
                'first_name_en' => $request->first_name_en ?? '',
                'last_name_en' => $request->last_name_en ?? '',
                'national_id' => $request->national_id,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->phone),
                'address' => $request->address,
                'preferred_language' => $request->preferred_language ?? 'ar',
                'image' => $request->hasFile('image') ? $request->file('image')->store('avatars', 'public') : null,
            ]);

            $role = \App\Models\Role::firstOrCreate(['name' => 'field_supervisor']);
            $user->roles()->attach($role->id);

            $user->fieldSupervisor()->create([
                'status' => strtolower($request->status ?? 'active'),
            ]);
        });

        return redirect()->back()->with('success', 'Field Supervisor registered successfully');
    }

    public function update(Request $request, User $field_supervisor)
    {
        $request->validate([
            'first_name_ar' => 'required_without:first_name_en|nullable|string|max:255',
            'last_name_ar' => 'required_with:first_name_ar|nullable|string|max:255',
            'first_name_en' => 'required_without:first_name_ar|nullable|string|max:255',
            'last_name_en' => 'required_with:first_name_en|nullable|string|max:255',
            'national_id' => ['required', 'numeric', Rule::unique('users')->ignore($field_supervisor->id)],
            'email' => ['nullable', 'email', Rule::unique('users')->ignore($field_supervisor->id)],
            'phone' => ['required', Rule::unique('users')->ignore($field_supervisor->id)],
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'id_card_front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'id_card_back_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'status' => 'required|in:active,inactive',
            'address' => 'nullable|string|max:500',
            'preferred_language' => 'nullable|in:ar,en',
            'remove_image' => 'nullable|boolean',
            'remove_id_card_front_image' => 'nullable|boolean',
            'remove_id_card_back_image' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($request, $field_supervisor) {
            $data = [
                'first_name_ar' => $request->first_name_ar ?? '',
                'last_name_ar' => $request->last_name_ar ?? '',
                'first_name_en' => $request->first_name_en ?? '',
                'last_name_en' => $request->last_name_en ?? '',
                'national_id' => $request->national_id,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
                'preferred_language' => $request->preferred_language ?? 'ar',
            ];

            if ($request->boolean('remove_image')) {
                if ($field_supervisor->image) {
                    Storage::disk('public')->delete($field_supervisor->image);
                }
                $data['image'] = null;
            } elseif ($request->hasFile('image')) {
                if ($field_supervisor->image) {
                    Storage::disk('public')->delete($field_supervisor->image);
                }
                $data['image'] = $request->file('image')->store('avatars', 'public');
            }

            $field_supervisor->update($data);

            // Update extension table
            $field_supervisor->fieldSupervisor()->updateOrCreate(
                ['user_id' => $field_supervisor->id],
                ['status' => strtolower($request->status ?? 'active')]
            );
        });

        return redirect()->back()->with('success', 'Field Supervisor updated successfully');
    }

    public function destroy(User $field_supervisor)
    {
        $field_supervisor->delete();

        return redirect()->back()->with('success', 'Field Supervisor deleted successfully');
    }

    public function export()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\FieldSupervisorsExport(false), 'field_supervisors.xlsx');
    }

    public function downloadTemplate()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\FieldSupervisorsExport(true), 'field_supervisors_template.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
        ]);

        $import = new \App\Imports\FieldSupervisorsImport;

        try {
            \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));
        } catch (\Throwable $e) {
            $errorMsg = 'فشل في معالجة ملف الاستيراد: '.$e->getMessage().' / Excel Import file processing failed: '.$e->getMessage();

            return redirect()->back()->with('import_errors', [$errorMsg]);
        }

        $errorsArray = [];

        if ($import->failures()->isNotEmpty()) {
            $customAttributes = (new \App\Imports\FieldSupervisorsImport)->customValidationAttributes();
            foreach ($import->failures() as $failure) {
                $row = $failure->row();
                $attributeKey = $failure->attribute();

                $originalKey = array_search($attributeKey, $customAttributes);
                if ($originalKey === false) {
                    $originalKey = $attributeKey;
                    $columnName = $customAttributes[$attributeKey] ?? $attributeKey;
                } else {
                    $columnName = $attributeKey;
                }

                $badValue = $failure->values()[$originalKey] ?? 'فارغة (Empty)';
                if (is_scalar($badValue) && trim((string) $badValue) === '') {
                    $badValue = 'فارغة (Empty)';
                }
                if ($badValue === null) {
                    $badValue = 'فارغة (Empty)';
                }

                $errors = implode(' | ', $failure->errors());

                $errorsArray[] = "السطر {$row} | العمود: [{$columnName}] | القيمة المدخلة: ({$badValue}) | الخطأ: {$errors}";
            }
        }

        if ($import->errors()->isNotEmpty()) {
            foreach ($import->errors() as $error) {
                $msg = $error->getMessage();
                if (str_contains($msg, 'Duplicate entry') && str_contains($msg, 'users_email_unique')) {
                    $errorsArray[] = 'خطأ قاعدة بيانات: البريد الإلكتروني مكرر ومسجل مسبقاً لدى مستخدم آخر / Database Error: Email address is already taken by another user.';
                } else {
                    $errorsArray[] = 'السطر خطأ: '.$msg.' / Skipped row processing error: '.$msg;
                }
            }
        }

        if (! empty($errorsArray)) {
            $msg = "تم استيراد {$import->successCount} مشرف ميداني بنجاح. وتم تخطي بعض الأسطر بسبب وجود أخطاء.";

            return redirect()->back()
                ->with('success', $msg)
                ->with('import_errors', $errorsArray);
        }

        return redirect()->back()->with('success', "تم استيراد {$import->successCount} مشرف ميداني بنجاح وتحديث القائمة.");
    }

    public function printAll(Request $request)
    {
        $statusFilter = $request->input('status', 'all');
        $search = $request->input('search');

        $query = User::whereHas('roles', fn ($q) => $q->where('name', 'field_supervisor'))
            ->with(['roles', 'fieldSupervisor']);

        if ($statusFilter === 'active') {
            $query->whereHas('fieldSupervisor', fn ($q) => $q->where('status', 'active'));
        } elseif ($statusFilter === 'inactive') {
            $query->whereHas('fieldSupervisor', fn ($q) => $q->where('status', 'inactive'));
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

        $query->latest();

        $supervisors = $query->get()->map(function ($supervisor) {
            return [
                'id' => $supervisor->id,
                'name' => $supervisor->name,
                'name_en' => $supervisor->name_en,
                'national_id' => $supervisor->national_id,
                'user_code' => $supervisor->user_code,
                'phone' => $supervisor->phone,
                'email' => $supervisor->email,
                'address' => $supervisor->address,
                'preferred_language' => $supervisor->preferred_language,
                'field_supervisor' => $supervisor->fieldSupervisor ? [
                    'status' => $supervisor->fieldSupervisor->status,
                ] : null,
            ];
        });

        $userLang = $request->input('lang') ?? auth()->user()->preferred_language ?? 'ar';
        $isRTL = $userLang === 'ar';

        return Inertia::render('Print/SharedPrintReport', [
            'title_ar' => 'تقرير بيانات المشرفين الميدانيين',
            'title_en' => 'Field Supervisors Operational Report',
            'subtitle_ar' => 'إدارة شركة مسارات واصل',
            'subtitle_en' => 'Masarat Wasel Company',
            'totalLabel_ar' => 'إجمالي الكادر',
            'totalLabel_en' => 'Total Force',
            'columns' => [
                ['key' => 'name', 'label_ar' => 'المشرف', 'label_en' => 'Supervisor', 'bold' => true],
                ['key' => 'national_id', 'label_ar' => 'الرقم المدني', 'label_en' => 'Civil ID', 'mono' => true],
                ['key' => 'phone', 'label_ar' => 'الجوال', 'label_en' => 'Phone'],
                ['key' => 'email', 'label_ar' => 'البريد الإلكتروني', 'label_en' => 'Email'],
                ['key' => 'preferred_language', 'label_ar' => 'اللغة', 'label_en' => 'Language'],
            ],
            'data' => $supervisors,
            'printDate' => now()->format('Y-m-d H:i:s'),
            'isRTL' => $isRTL,
        ]);
    }
}
