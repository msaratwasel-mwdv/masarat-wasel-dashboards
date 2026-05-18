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

class AssistantController extends Controller
{
    use \App\Traits\DataTableTrait;

    public function index(Request $request)
    {
        $statusFilter = $request->input('status', 'all');

        $query = User::whereHas('roles', fn($q) => $q->where('name', 'assistant'))
            ->with(['roles', 'assistant', 'assignedBusAsAssistant.school']);

        if ($statusFilter === 'assigned') {
            $query->whereHas('assignedBusAsAssistant');
        } elseif ($statusFilter === 'available') {
            $query->whereDoesntHave('assignedBusAsAssistant');
        }

        $paginated = $this->applyDataTable($query, $request, [
            'name',
            'national_id',
            'phone',
            'email',
        ], 15, function($assistant) {
            return [
                'الاسم' => $assistant->name,
                'الاسم (EN)' => $assistant->name_en,
                'الكود' => $assistant->user_code,
                'الهوية' => $assistant->national_id,
                'رقم الجوال' => $assistant->phone,
                'البريد الإلكتروني' => $assistant->email,
                'الباص المعين' => $assistant->assignedBusAsAssistant?->bus_number ?? 'متاح',
                'الحالة' => match($assistant->assistant?->status ?? '') {
                    'active' => 'نشط',
                    'inactive' => 'غير نشط',
                    default => $assistant->assistant?->status ?? 'نشط',
                },
            ];
        });

        if ($paginated instanceof \Symfony\Component\HttpFoundation\Response) {
            return $paginated;
        }

        $counts = \Illuminate\Support\Facades\Cache::remember('assistant_counts', 600, function() {
            $assistantUserIds = \Illuminate\Support\Facades\DB::table('user_roles')
                ->join('roles', 'user_roles.role_id', '=', 'roles.id')
                ->where('roles.name', 'assistant')
                ->pluck('user_roles.user_id');

            $assignedCount = \Illuminate\Support\Facades\DB::table('buses')
                ->whereIn('assistant_id', $assistantUserIds)
                ->whereNull('deleted_at')
                ->distinct('assistant_id')
                ->count('assistant_id');

            $totalCount = $assistantUserIds->count();

            return [
                'all' => $totalCount,
                'assigned' => $assignedCount,
                'available' => $totalCount - $assignedCount,
            ];
        });

        return Inertia::render('Admin/Assistants/Index', [
            'assistants' => $paginated,
            'counts'      => $counts,
            'filters'     => [
                'search' => $request->input('search', ''),
                'status' => $statusFilter,
            ]
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
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
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

            $assistantRole = \App\Models\Role::firstOrCreate(['name' => 'assistant']);
            $user->roles()->attach($assistantRole->id);

            $user->assistant()->create([
                'status' => strtolower($request->status ?? 'active'),
                'emergency_contact_name' => $request->emergency_contact_name,
                'emergency_contact_phone' => $request->emergency_contact_phone,
                'id_card_front_image' => $request->hasFile('id_card_front_image') ? $request->file('id_card_front_image')->store('assistants/id_cards', 'public') : null,
                'id_card_back_image' => $request->hasFile('id_card_back_image') ? $request->file('id_card_back_image')->store('assistants/id_cards', 'public') : null,
            ]);
        });

        return redirect()->back()->with('success', 'Assistant registered successfully');
    }

    public function update(Request $request, User $assistant)
    {
        $request->validate([
            'first_name_ar' => 'required_without:first_name_en|nullable|string|max:255',
            'last_name_ar' => 'required_with:first_name_ar|nullable|string|max:255',
            'first_name_en' => 'required_without:first_name_ar|nullable|string|max:255',
            'last_name_en' => 'required_with:first_name_en|nullable|string|max:255',
            'national_id' => ['required', 'numeric', Rule::unique('users')->ignore($assistant->id)],
            'email' => ['nullable', 'email', Rule::unique('users')->ignore($assistant->id)],
            'phone' => ['required', Rule::unique('users')->ignore($assistant->id)],
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'id_card_front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'id_card_back_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'emergency_contact_name' => 'nullable|string',
            'emergency_contact_phone' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'address' => 'nullable|string|max:500',
            'preferred_language' => 'nullable|in:ar,en',
            'remove_image' => 'nullable|boolean',
            'remove_id_card_front_image' => 'nullable|boolean',
            'remove_id_card_back_image' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($request, $assistant) {
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
                if ($assistant->image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($assistant->image);
                }
                $data['image'] = null;
            } elseif ($request->hasFile('image')) {
                if ($assistant->image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($assistant->image);
                }
                $data['image'] = $request->file('image')->store('avatars', 'public');
            }

            $assistant->update($data);

            $assistantExtData = [
                'status' => strtolower($request->status ?? 'active'),
                'emergency_contact_name' => $request->emergency_contact_name,
                'emergency_contact_phone' => $request->emergency_contact_phone,
            ];

            $assistantExtRecord = $assistant->assistant()->firstOrCreate(['user_id' => $assistant->id]);

            if ($request->boolean('remove_id_card_front_image')) {
                if ($assistantExtRecord->id_card_front_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($assistantExtRecord->id_card_front_image);
                }
                $assistantExtData['id_card_front_image'] = null;
            } elseif ($request->hasFile('id_card_front_image')) {
                if ($assistantExtRecord->id_card_front_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($assistantExtRecord->id_card_front_image);
                }
                $assistantExtData['id_card_front_image'] = $request->file('id_card_front_image')->store('assistants/id_cards', 'public');
            }

            if ($request->boolean('remove_id_card_back_image')) {
                if ($assistantExtRecord->id_card_back_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($assistantExtRecord->id_card_back_image);
                }
                $assistantExtData['id_card_back_image'] = null;
            } elseif ($request->hasFile('id_card_back_image')) {
                if ($assistantExtRecord->id_card_back_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($assistantExtRecord->id_card_back_image);
                }
                $assistantExtData['id_card_back_image'] = $request->file('id_card_back_image')->store('assistants/id_cards', 'public');
            }

            // Update assistant extension record
            $assistant->assistant()->updateOrCreate(
                ['user_id' => $assistant->id],
                $assistantExtData
            );
        });

        return redirect()->back()->with('success', 'Assistant updated successfully');
    }

    public function destroy(User $assistant)
    {
        $assistant->delete();
        return redirect()->back()->with('success', 'Assistant deleted successfully');
    }

    public function printCard(User $assistant)
    {
        $assistant->load(['assistant', 'assignedBusAsAssistant.school']);

        return Inertia::render('Admin/Drivers/PrintCard', [
            'driver' => $assistant,
            'jobTitle' => 'مشرفة حافلة'
        ]);
    }

    public function export()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\AssistantsExport(false), 'assistants.xlsx');
    }

    public function downloadTemplate()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\AssistantsExport(true), 'assistants_template.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
        ]);

        $import = new \App\Imports\AssistantsImport();

        try {
            \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));
        } catch (\Throwable $e) {
            $errorMsg = "فشل في معالجة ملف الاستيراد: " . $e->getMessage() . " / Excel Import file processing failed: " . $e->getMessage();
            return redirect()->back()->with('import_errors', [$errorMsg]);
        }

        $errorsArray = [];

        if ($import->failures()->isNotEmpty()) {
            $customAttributes = (new \App\Imports\AssistantsImport())->customValidationAttributes();
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
                if (is_scalar($badValue) && trim((string)$badValue) === '') $badValue = 'فارغة (Empty)';
                if ($badValue === null) $badValue = 'فارغة (Empty)';

                $errors = implode(' | ', $failure->errors());

                $errorsArray[] = "السطر {$row} | العمود: [{$columnName}] | القيمة المدخلة: ({$badValue}) | الخطأ: {$errors}";
            }
        }

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

        if (!empty($errorsArray)) {
            $msg = "تم استيراد {$import->successCount} مشرفة بنجاح. وتم تخطي بعض الأسطر بسبب وجود أخطاء.";
            return redirect()->back()
                ->with('success', $msg)
                ->with('import_errors', $errorsArray);
        }

        return redirect()->back()->with('success', "تم استيراد {$import->successCount} مشرفة بنجاح وتحديث القائمة.");
    }

    public function printAll(Request $request)
    {
        $statusFilter = $request->input('status', 'all');
        $search = $request->input('search');

        $query = User::whereHas('roles', fn($q) => $q->where('name', 'assistant'))
            ->with(['roles', 'assistant', 'assignedBusAsAssistant.school']);

        if ($statusFilter === 'assigned') {
            $query->whereHas('assignedBusAsAssistant');
        } elseif ($statusFilter === 'available') {
            $query->whereDoesntHave('assignedBusAsAssistant');
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('first_name_ar', 'like', "%{$search}%")
                  ->orWhere('last_name_ar', 'like', "%{$search}%")
                  ->orWhere('first_name_en', 'like', "%{$search}%")
                  ->orWhere('last_name_en', 'like', "%{$search}%")
                  ->orWhere('national_id', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $sortColumn = $request->input('sort');
        $sortDirection = $request->input('direction', 'desc');
        if ($sortColumn && in_array($sortDirection, ['asc', 'desc'])) {
            if ($sortColumn === 'name') {
                $query->orderBy('name', $sortDirection);
            } elseif ($sortColumn === 'national_id') {
                $query->orderBy('national_id', $sortDirection);
            } else {
                $query->orderBy($sortColumn, $sortDirection);
            }
        } else {
            $query->latest();
        }

        $assistants = $query->get()->map(function($assistant) {
            return [
                'id' => $assistant->id,
                'name' => $assistant->name,
                'name_en' => $assistant->name_en,
                'national_id' => $assistant->national_id,
                'user_code' => $assistant->user_code,
                'phone' => $assistant->phone,
                'email' => $assistant->email,
                'address' => $assistant->address,
                'preferred_language' => $assistant->preferred_language,
                'assigned_bus_as_assistant' => $assistant->assignedBusAsAssistant ? [
                    'id' => $assistant->assignedBusAsAssistant->id,
                    'bus_number' => $assistant->assignedBusAsAssistant->bus_number,
                    'school' => $assistant->assignedBusAsAssistant->school ? [
                        'id' => $assistant->assignedBusAsAssistant->school->id,
                        'name' => $assistant->assignedBusAsAssistant->school->name,
                    ] : null,
                ] : null,
                'assistant' => $assistant->assistant ? [
                    'status' => $assistant->assistant->status,
                ] : null,
            ];
        });

        $userLang = $request->input('lang') ?? auth()->user()->preferred_language ?? 'ar';
        $isRTL = $userLang === 'ar';

        return Inertia::render('Print/SharedPrintReport', [
            'title_ar' => 'تقرير بيانات مشرفات الحافلات',
            'title_en' => 'Bus Supervisors Operational Report',
            'subtitle_ar' => 'إدارة شركة مسارات واصل',
            'subtitle_en' => 'Masarat Wasel Company',
            'totalLabel_ar' => 'إجمالي الكادر',
            'totalLabel_en' => 'Total Force',
            'columns' => [
                ['key' => 'name', 'label_ar' => 'المشرفة', 'label_en' => 'Supervisor', 'bold' => true],
                ['key' => 'national_id', 'label_ar' => 'الرقم المدني', 'label_en' => 'Civil ID', 'mono' => true],
                ['key' => 'phone', 'label_ar' => 'الجوال', 'label_en' => 'Phone'],
                ['key' => 'email', 'label_ar' => 'البريد الإلكتروني', 'label_en' => 'Email'],
                ['key' => 'assigned_bus_as_assistant.bus_number', 'label_ar' => 'الحافلة', 'label_en' => 'Bus/Coach'],
                ['key' => 'preferred_language', 'label_ar' => 'اللغة', 'label_en' => 'Language'],
            ],
            'data' => $assistants,
            'printDate' => now()->format('Y-m-d H:i:s'),
            'isRTL' => $isRTL,
        ]);
    }
}
