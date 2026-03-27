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

class SupervisorController extends Controller
{
    use \App\Traits\DataTableTrait;

    public function index(Request $request)
    {
        $statusFilter = $request->input('status', 'all');

        $query = User::where('role', 'supervisor')
            ->with(['supervisorProfile', 'assignedBusAsSupervisor.school']);

        if ($statusFilter === 'assigned') {
            $query->whereHas('assignedBusAsSupervisor');
        } elseif ($statusFilter === 'available') {
            $query->whereDoesntHave('assignedBusAsSupervisor');
        }

        $paginated = $this->applyDataTable($query, $request, [
            'name',
            'name_en',
            'national_id',
            'phone',
            'email',
            'user_code',
        ], 15, function($supervisor) {
            return [
                'الاسم' => $supervisor->name,
                'الاسم (EN)' => $supervisor->name_en,
                'الكود' => $supervisor->user_code,
                'الهوية' => $supervisor->national_id,
                'رقم الجوال' => $supervisor->phone,
                'البريد الإلكتروني' => $supervisor->email,
                'اسم جهة الطوارئ' => $supervisor->supervisorProfile ? $supervisor->supervisorProfile->emergency_contact_name : 'غير محدد',
                'رقم هاتف الطوارئ' => $supervisor->supervisorProfile ? $supervisor->supervisorProfile->emergency_contact_phone : 'غير محدد',
                'الباص المعين' => $supervisor->assignedBusAsSupervisor ? $supervisor->assignedBusAsSupervisor->bus_code : 'متاح',
                'الحالة' => $supervisor->supervisorProfile 
                    ? match($supervisor->supervisorProfile->status) {
                        'active' => 'نشط',
                        'inactive' => 'غير نشط',
                        'pending' => 'قيد المراجعة',
                        default => $supervisor->supervisorProfile->status
                    } 
                    : 'نشط',
            ];
        });

        if ($paginated instanceof \Symfony\Component\HttpFoundation\Response) {
            return $paginated;
        }

        $counts = [
            'all' => User::where('role', 'supervisor')->count(),
            'assigned' => User::where('role', 'supervisor')->whereHas('assignedBusAsSupervisor')->count(),
            'available' => User::where('role', 'supervisor')->whereDoesntHave('assignedBusAsSupervisor')->count(),
        ];

        return Inertia::render('Admin/Supervisors/Index', [
            'supervisors' => $paginated,
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
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'national_id' => 'required|numeric|unique:users,national_id',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|unique:users,phone',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            // بيانات البروفايل
            'emergency_contact_name' => 'required|string|max:255',
            'emergency_contact_phone' => 'required|string|max:20',
        ]);

        DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'name_en' => $request->name_en,
                'national_id' => $request->national_id,
                'email' => $request->email,
                'phone' => $request->phone,
                // كلمة المرور الافتراضية هي رقم الجوال
                'password' => Hash::make($request->phone),
                'role' => 'supervisor',
                'school_id' => null,
                'user_code' => 'SUP-' . rand(1000, 9999),
                'image' => $request->hasFile('image') ? $request->file('image')->store('avatars', 'public') : null,
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
            'name_en' => 'nullable|string|max:255',
            'national_id' => ['required', 'numeric', Rule::unique('users')->ignore($supervisor->id)],
            'email' => ['required', 'email', Rule::unique('users')->ignore($supervisor->id)],
            'phone' => ['required', Rule::unique('users')->ignore($supervisor->id)],
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'emergency_contact_name' => 'required|string',
            'emergency_contact_phone' => 'required|string',
            'status' => 'required|in:Trainee,Active,On Leave,Inactive',
        ]);

        DB::transaction(function () use ($request, $supervisor) {
            $data = [
                'name' => $request->name,
                'name_en' => $request->name_en,
                'national_id' => $request->national_id,
                'email' => $request->email,
                'phone' => $request->phone,
            ];

            if ($request->hasFile('image')) {
                if ($supervisor->image) {
                    Storage::disk('public')->delete($supervisor->image);
                }
                $data['image'] = $request->file('image')->store('avatars', 'public');
            }

            $supervisor->update($data);

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
