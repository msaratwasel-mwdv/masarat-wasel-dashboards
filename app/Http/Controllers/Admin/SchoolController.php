<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSchoolRequest;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SchoolController extends Controller
{
    public function index()
    {
        $schools = School::withCount(['buses', 'enrollments'])
            ->latest()
            ->get();

        return Inertia::render('Admin/Schools/Index', [
            'schools' => $schools,
            'plans' => \App\Models\Plan::active()->orderBy('sort_order')->get()
        ]);
    }



    public function store(StoreSchoolRequest $request)
    {
        return DB::transaction(function () use ($request) {
            $data = $request->validated();
            
            if ($request->hasFile('logo')) {
                $data['logo'] = $request->file('logo')->store('schools/logos', 'public');
            }

            $school = School::create($data);

            // Create admin if requested
            if ($request->create_admin) {
                $ar = \App\Models\User::parseFullName($request->admin_name);

                $adminData = [
                    'first_name_ar' => $ar[0],
                    'second_name_ar' => $ar[1],
                    'third_name_ar' => $ar[2],
                    'last_name_ar' => $ar[3] ?: $ar[0],
                    'email' => $request->admin_email,
                    'phone' => $request->admin_phone,
                    'national_id' => $request->admin_national_id,
                    'address' => $request->admin_address,
                    'password' => \Illuminate\Support\Facades\Hash::make($request->admin_password),
                ];

                if ($request->hasFile('admin_image')) {
                    $adminData['image'] = $request->file('admin_image')->store('users/images', 'public');
                }

                // If name_en is not sent from frontend yet, we default it to handle the not-null constraint if applicable
                $adminData['first_name_en'] = $ar[0];
                $adminData['second_name_en'] = $ar[1];
                $adminData['third_name_en'] = $ar[2];
                $adminData['last_name_en'] = $ar[3] ?: $ar[0];

                $user = \App\Models\User::create($adminData);

                $role = \App\Models\Role::firstOrCreate(['name' => 'school_admin']);
                $user->roles()->attach($role->id);

                \App\Models\SchoolAdmin::create([
                    'user_id' => $user->id,
                    'school_id' => $school->id,
                ]);
            }

            return redirect()->route('admin.schools.index')
                ->with('message', 'School created successfully' . ($request->create_admin ? ' with admin' : ''));
        });
    }
    public function show(School $school)
    {
        // Admins are linked via the school_admins extension table, not users.school_id
        $school->load('schoolAdmins.user');

        // Map school admins to a simple users array for the frontend
        $school->users = $school->schoolAdmins->map(function($sa) {
            return [
                'id' => $sa->user->id,
                'name' => $sa->user->name,
                'email' => $sa->user->email,
                'phone' => $sa->user->phone,
                'national_id' => $sa->user->national_id,
                'address' => $sa->user->address,
                'image' => $sa->user->image,
                'role' => $sa->user->role,
            ];
        });

        $stats = [
            // عدد الطلاب التابعين للمدرسة (باستخدام السكوب الصحيح)
            'students_count' => \App\Models\Student::inSchool($school->id)->count(),

            // عدد الباصات المخصصة للمدرسة
            'buses_count' => \App\Models\Bus::where('school_id', $school->id)->count(),
            'active_buses' => \App\Models\Bus::where('school_id', $school->id)
                ->where('status', 'active')
                ->count(),
            'maintenance_buses' => \App\Models\Bus::where('school_id', $school->id)
                ->where('status', 'maintenance')
                ->count(),

            // عدد السائقين المخصصين لهذه المدرسة (المعينين على باصات تابعة للمدرسة)
            'drivers_count' => \App\Models\Driver::whereHas('bus', function($q) use ($school) {
                $q->where('school_id', $school->id);
            })->count(),

            // عدد المساعدين المخصصين لباصات هذه المدرسة
            'assistants_count' => \App\Models\Bus::where('school_id', $school->id)
                ->whereNotNull('assistant_id')
                ->distinct('assistant_id')
                ->count(),

            // عدد مدراء المدرسة — via school_admins extension table
            'admins_count' => $school->schoolAdmins->count(),
        ];

        return Inertia::render('Admin/Schools/Show', [
            'school' => $school,
            'stats' => $stats
        ]);
    }



    public function update(StoreSchoolRequest $request, School $school)
    {
        $data = $request->validated();

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($school->logo) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($school->logo);
            }
            $data['logo'] = $request->file('logo')->store('schools/logos', 'public');
        }

        $school->update($data);

        return redirect()->route('admin.schools.index')
            ->with('message', 'School updated successfully');
    }

    public function destroy(School $school)
    {
        $school->delete();

        return redirect()->route('admin.schools.index')
            ->with('message', 'School deleted successfully');
    }

    public function toggleStatus(School $school)
    {
        $school->status = $school->status === 'Active' ? 'Inactive' : 'Active';
        $school->save();

        return back()->with('message', 'تم تحديث حالة المدرسة بنجاح');
    }
}


