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
            ->with('fieldSupervisor')
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
            'last_name_ar'   => 'required|string|max:255',
            'first_name_en'  => 'nullable|string|max:255',
            'last_name_en'   => 'nullable|string|max:255',
            'national_id'    => 'required|numeric|unique:users,national_id',
            'email'          => 'nullable|email|unique:users,email',
            'phone'          => 'required|unique:users,phone',
        ]);

        DB::transaction(function () use ($request) {
            $user = User::create([
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
                'is_active'      => true,
            ]);

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
            'national_id' => ['required', 'numeric', Rule::unique('users')->ignore($field_supervisor->id)],
            'email'       => ['nullable', 'email', Rule::unique('users')->ignore($field_supervisor->id)],
            'phone'       => ['required', Rule::unique('users')->ignore($field_supervisor->id)],
            'is_active'   => 'boolean',
        ]);

        $field_supervisor->update([
            'national_id' => $request->national_id,
            'email'       => $request->email,
            'phone'       => $request->phone,
            'is_active'   => $request->has('is_active') ? $request->is_active : $field_supervisor->is_active,
        ]);

        return redirect()->back()->with('success', 'Field Supervisor updated successfully');
    }

    public function destroy(User $field_supervisor)
    {
        $field_supervisor->delete();
        return redirect()->back()->with('success', 'Field Supervisor deleted successfully');
    }
}
