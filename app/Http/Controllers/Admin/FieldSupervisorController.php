<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FieldSupervisor;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class FieldSupervisorController extends Controller
{
    public function index()
    {
        // Field supervisors are users with the 'field_supervisor' role
        $supervisors = User::whereHas('roles', fn($q) => $q->where('name', 'field_supervisor'))
            ->with(['roles', 'fieldSupervisor'])
            ->latest()
            ->get();

        return Inertia::render('Admin/FieldSupervisors/Index', [
            'supervisors' => $supervisors
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name_ar'  => 'required|string|max:255',
            'second_name_ar' => 'nullable|string|max:255',
            'third_name_ar'  => 'nullable|string|max:255',
            'last_name_ar'   => 'required|string|max:255',
            'first_name_en'  => 'nullable|string|max:255',
            'second_name_en' => 'nullable|string|max:255',
            'third_name_en'  => 'nullable|string|max:255',
            'last_name_en'   => 'nullable|string|max:255',
            'national_id'    => 'required|numeric|unique:users,national_id',
            'email'          => 'required|email|unique:users,email',
            'image'          => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'address'        => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($request) {
            $userData = [
                'first_name_ar'  => $request->first_name_ar,
                'second_name_ar' => $request->second_name_ar ?? '',
                'third_name_ar'  => $request->third_name_ar ?? '',
                'last_name_ar'   => $request->last_name_ar,
                'first_name_en'  => $request->first_name_en ?? '',
                'second_name_en' => $request->second_name_en ?? '',
                'third_name_en'  => $request->third_name_en ?? '',
                'last_name_en'   => $request->last_name_en ?? '',
                'national_id'    => $request->national_id,
                'email'          => $request->email,
                'phone'          => $request->phone,
                'password'       => Hash::make($request->phone),
                'address'        => $request->address,
            ];

            if ($request->hasFile('image')) {
                $userData['image'] = $request->file('image')->store('avatars', 'public');
            }

            $user = User::create($userData);

            // Attach role via user_roles pivot
            $role = Role::firstOrCreate(['name' => 'field_supervisor']);
            $user->roles()->attach($role->id);

            // Create extension record in field_supervisors table
            FieldSupervisor::create([
                'user_id' => $user->id,
                'status'  => 'active',
            ]);
        });

        return redirect()->back()->with('success', 'Field Supervisor registered successfully');
    }

    public function update(Request $request, User $field_supervisor)
    {
        $request->validate([
            'first_name_ar'  => 'required|string|max:255',
            'second_name_ar' => 'nullable|string|max:255',
            'third_name_ar'  => 'nullable|string|max:255',
            'last_name_ar'   => 'required|string|max:255',
            'first_name_en'  => 'nullable|string|max:255',
            'second_name_en' => 'nullable|string|max:255',
            'third_name_en'  => 'nullable|string|max:255',
            'last_name_en'   => 'nullable|string|max:255',
            'national_id'    => ['required', 'numeric', Rule::unique('users')->ignore($field_supervisor->id)],
            'email'          => ['required', 'email', Rule::unique('users')->ignore($field_supervisor->id)],
            'phone'          => ['required', Rule::unique('users')->ignore($field_supervisor->id)],
            'is_active'      => 'boolean',
            'image'          => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'address'        => 'nullable|string|max:500',
        ]);

        $data = [
            'first_name_ar'  => $request->first_name_ar,
            'second_name_ar' => $request->second_name_ar ?? '',
            'third_name_ar'  => $request->third_name_ar ?? '',
            'last_name_ar'   => $request->last_name_ar,
            'first_name_en'  => $request->first_name_en ?? '',
            'second_name_en' => $request->second_name_en ?? '',
            'third_name_en'  => $request->third_name_en ?? '',
            'last_name_en'   => $request->last_name_en ?? '',
            'national_id'    => $request->national_id,
            'email'          => $request->email,
            'phone'          => $request->phone,
            'address'        => $request->address,
        ];

        if ($request->hasFile('image')) {
            if ($field_supervisor->image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($field_supervisor->image);
            }
            $data['image'] = $request->file('image')->store('avatars', 'public');
        }

        $field_supervisor->update($data);

        // Update status in the extension table
        $field_supervisor->fieldSupervisor()->updateOrCreate(
            ['user_id' => $field_supervisor->id],
            ['status' => strtolower($request->status ?? 'active')]
        );

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

        $import = new \App\Imports\FieldSupervisorsImport();
        \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));

        return redirect()->back()->with('success', "تم استيراد {$import->successCount} مشرف ميداني بنجاح وتحديث القائمة.");
    }
}
