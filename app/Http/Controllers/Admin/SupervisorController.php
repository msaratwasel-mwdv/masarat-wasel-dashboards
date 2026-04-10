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

        $query = User::whereHas('roles', fn($q) => $q->where('name', 'supervisor'))
            ->with(['fieldSupervisor', 'assignedBusAsSupervisor.school']);

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
                'الباص المعين' => $supervisor->assignedBusAsSupervisor?->bus_number ?? 'متاح',
                'الحالة' => match($supervisor->fieldSupervisor?->status ?? '') {
                    'active' => 'نشط',
                    'inactive' => 'غير نشط',
                    default => $supervisor->fieldSupervisor?->status ?? 'نشط',
                },
            ];
        });

        if ($paginated instanceof \Symfony\Component\HttpFoundation\Response) {
            return $paginated;
        }

        $counts = [
            'all' => User::whereHas('roles', fn($q) => $q->where('name', 'supervisor'))->count(),
            'assigned' => User::whereHas('roles', fn($q) => $q->where('name', 'supervisor'))->whereHas('assignedBusAsSupervisor')->count(),
            'available' => User::whereHas('roles', fn($q) => $q->where('name', 'supervisor'))->whereDoesntHave('assignedBusAsSupervisor')->count(),
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
                'is_active' => true,
            ]);

            // Attach role via user_roles pivot
            $supervisorRole = \App\Models\Role::firstOrCreate(['name' => 'supervisor']);
            $user->roles()->attach($supervisorRole->id);

            // Create extension record in field_supervisors table
            $user->fieldSupervisor()->create([
                'status' => 'active',
            ]);
        });

        return redirect()->back()->with('success', 'Supervisor registered successfully');
    }

    public function update(Request $request, User $supervisor)
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
            ];

            if ($request->hasFile('image')) {
                if ($supervisor->image) {
                    Storage::disk('public')->delete($supervisor->image);
                }
                $data['image'] = $request->file('image')->store('avatars', 'public');
            }

            $supervisor->update($data);

            // Update field supervisor extension record
            $supervisor->fieldSupervisor()->updateOrCreate(
                ['user_id' => $supervisor->id],
                ['status' => $request->status ?? 'active']
            );
        });

        return redirect()->back()->with('success', 'Supervisor updated successfully');
    }

    public function destroy(User $supervisor)
    {
        $supervisor->delete();
        return redirect()->back()->with('success', 'Supervisor deleted successfully');
    }
}


