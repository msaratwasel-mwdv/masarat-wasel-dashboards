<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class FieldSupervisorController extends Controller
{
    public function index()
    {
        $supervisors = User::where('role', 'field_supervisor')
            ->latest()
            ->get();

        return Inertia::render('Admin/FieldSupervisors/Index', [
            'supervisors' => $supervisors
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'national_id' => 'required|numeric|unique:users,national_id',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|unique:users,phone',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        User::create([
            'name' => $request->name,
            'name_en' => $request->name_en,
            'national_id' => $request->national_id,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->phone),
            'role' => 'field_supervisor',
            'school_id' => null,
            'user_code' => 'OF-' . rand(1000, 9999),
            'image' => $request->hasFile('image') ? $request->file('image')->store('avatars', 'public') : null,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'Field Supervisor registered successfully');
    }

    public function update(Request $request, User $field_supervisor)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'national_id' => ['required', 'numeric', Rule::unique('users')->ignore($field_supervisor->id)],
            'email' => ['required', 'email', Rule::unique('users')->ignore($field_supervisor->id)],
            'phone' => ['required', Rule::unique('users')->ignore($field_supervisor->id)],
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'is_active' => 'boolean',
        ]);

        $data = [
            'name' => $request->name,
            'name_en' => $request->name_en,
            'national_id' => $request->national_id,
            'email' => $request->email,
            'phone' => $request->phone,
            'is_active' => $request->has('is_active') ? $request->is_active : $field_supervisor->is_active,
        ];

        if ($request->hasFile('image')) {
            if ($field_supervisor->image) {
                Storage::disk('public')->delete($field_supervisor->image);
            }
            $data['image'] = $request->file('image')->store('avatars', 'public');
        }

        $field_supervisor->update($data);

        return redirect()->back()->with('success', 'Field Supervisor updated successfully');
    }

    public function destroy(User $field_supervisor)
    {
        $field_supervisor->delete();
        return redirect()->back()->with('success', 'Field Supervisor deleted successfully');
    }
}
