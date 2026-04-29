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
            ->with(['assistant', 'assignedBusAsAssistant.school']);

        if ($statusFilter === 'assigned') {
            $query->whereHas('assignedBusAsAssistant');
        } elseif ($statusFilter === 'available') {
            $query->whereDoesntHave('assignedBusAsAssistant');
        }

        $paginated = $this->applyDataTable($query, $request, [
            'name',
            'name_en',
            'national_id',
            'phone',
            'email',
            'user_code',
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

        $counts = [
            'all' => User::whereHas('roles', fn($q) => $q->where('name', 'assistant'))->count(),
            'assigned' => User::whereHas('roles', fn($q) => $q->where('name', 'assistant'))->whereHas('assignedBusAsAssistant')->count(),
            'available' => User::whereHas('roles', fn($q) => $q->where('name', 'assistant'))->whereDoesntHave('assignedBusAsAssistant')->count(),
        ];

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
            'first_name_ar' => 'required|string|max:255',
            'second_name_ar' => 'nullable|string|max:255',
            'third_name_ar' => 'nullable|string|max:255',
            'last_name_ar' => 'required|string|max:255',
            'first_name_en' => 'nullable|string|max:255',
            'second_name_en' => 'nullable|string|max:255',
            'third_name_en' => 'nullable|string|max:255',
            'last_name_en' => 'nullable|string|max:255',
            'national_id' => 'required|numeric|unique:users,national_id',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|unique:users,phone',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            // بيانات البروفايل
            'emergency_contact_name' => 'required|string|max:255',
            'emergency_contact_phone' => 'required|string|max:20',
            'status' => 'nullable|in:active,inactive',
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
                'national_id' => $request->national_id,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->phone),
                'address' => $request->address,
                'image' => $request->hasFile('image') ? $request->file('image')->store('avatars', 'public') : null,
            ]);

            // Attach role via user_roles pivot
            $assistantRole = \App\Models\Role::firstOrCreate(['name' => 'assistant']);
            $user->roles()->attach($assistantRole->id);

            // Create extension record in assistants table
            $user->assistant()->create([
                'status' => strtolower($request->status ?? 'active'),
                'emergency_contact_name' => $request->emergency_contact_name,
                'emergency_contact_phone' => $request->emergency_contact_phone,
            ]);
        });

        return redirect()->back()->with('success', 'Assistant registered successfully');
    }

    public function update(Request $request, User $assistant)
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
            'national_id' => ['required', 'numeric', Rule::unique('users')->ignore($assistant->id)],
            'email' => ['required', 'email', Rule::unique('users')->ignore($assistant->id)],
            'phone' => ['required', Rule::unique('users')->ignore($assistant->id)],
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'emergency_contact_name' => 'required|string',
            'emergency_contact_phone' => 'required|string',
            'status' => 'required|in:active,inactive',
            'address' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($request, $assistant) {
            $data = [
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
                if ($assistant->image) {
                    Storage::disk('public')->delete($assistant->image);
                }
                $data['image'] = $request->file('image')->store('avatars', 'public');
            }

            $assistant->update($data);

            // Update assistant extension record
            $assistant->assistant()->updateOrCreate(
                ['user_id' => $assistant->id],
                [
                    'status' => strtolower($request->status ?? 'active'),
                    'emergency_contact_name' => $request->emergency_contact_name,
                    'emergency_contact_phone' => $request->emergency_contact_phone,
                ]
            );
        });

        return redirect()->back()->with('success', 'Assistant updated successfully');
    }

    public function destroy(User $assistant)
    {
        $assistant->delete();
        return redirect()->back()->with('success', 'Assistant deleted successfully');
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
        \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));

        return redirect()->back()->with('success', "تم استيراد {$import->successCount} مشرفة بنجاح وتحديث القائمة.");
    }
}
