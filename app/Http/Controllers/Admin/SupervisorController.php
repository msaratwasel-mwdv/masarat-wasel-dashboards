<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class SupervisorController extends Controller
{
    public function index()
    {
        $supervisors = User::where('role', 'supervisor')
            ->whereNull('school_id') // مشرفو الشركة
            ->with('supervisorProfile')
            ->latest()
            ->get();

        return Inertia::render('Admin/Supervisors/Index', [
            'supervisors' => $supervisors
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|unique:users,phone',
            // بيانات البروفايل
            'emergency_contact_name' => 'required|string|max:255',
            'emergency_contact_phone' => 'required|string|max:20',
        ]);

        DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                // كلمة المرور الافتراضية هي رقم الجوال
                'password' => Hash::make($request->phone),
                'role' => 'supervisor',
                'school_id' => null,
                'user_code' => 'SUP-' . rand(1000, 9999),
                'is_active' => true,
            ]);

            $user->supervisorProfile()->create([
                'emergency_contact_name' => $request->emergency_contact_name,
                'emergency_contact_phone' => $request->emergency_contact_phone,
                'status' => 'Trainee', // الحالة الافتراضية
            ]);
        });

        return redirect()->back()->with('success', 'Supervisor registered successfully');
    }

    public function update(Request $request, User $supervisor)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($supervisor->id)],
            'phone' => ['required', Rule::unique('users')->ignore($supervisor->id)],
            'emergency_contact_name' => 'required|string',
            'emergency_contact_phone' => 'required|string',
            'status' => 'required|in:Trainee,Active,On Leave,Inactive',
        ]);

        DB::transaction(function () use ($request, $supervisor) {
            $supervisor->update([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
            ]);

            $supervisor->supervisorProfile()->update([
                'emergency_contact_name' => $request->emergency_contact_name,
                'emergency_contact_phone' => $request->emergency_contact_phone,
                'status' => $request->status,
            ]);
        });

        return redirect()->back()->with('success', 'Supervisor updated successfully');
    }

    public function destroy(User $supervisor)
    {
        $supervisor->delete();
        return redirect()->back()->with('success', 'Supervisor deleted successfully');
    }
}
