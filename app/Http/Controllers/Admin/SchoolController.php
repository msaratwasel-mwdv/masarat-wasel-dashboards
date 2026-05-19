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
                ->with('success', 'School created successfully' . ($request->create_admin ? ' with admin' : ''));
        });
    }
    public function show(School $school)
    {
        // ⚡ Eager load admins + their users in 2 queries instead of N+1
        $school->load('schoolAdmins.user');

        $school->users = $school->schoolAdmins->map(function($sa) {
            return [
                'id'         => $sa->user->id,
                'name'       => $sa->user->name,
                'email'      => $sa->user->email,
                'phone'      => $sa->user->phone,
                'national_id'=> $sa->user->national_id,
                'address'    => $sa->user->address,
                'image'      => $sa->user->image,
                'role'       => $sa->user->role,
            ];
        });

        // ⚡ Single aggregated query instead of 6 separate COUNTs
        $busStats = \App\Models\Bus::where('school_id', $school->id)
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
                SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_count,
                COUNT(DISTINCT assistant_id) FILTER (WHERE assistant_id IS NOT NULL) as assistants_count
            ")
            ->first();

        $stats = [
            'students_count'    => \App\Models\Student::inSchool($school->id)->count(),
            'buses_count'       => (int) ($busStats->total ?? 0),
            'active_buses'      => (int) ($busStats->active_count ?? 0),
            'maintenance_buses' => (int) ($busStats->maintenance_count ?? 0),
            'drivers_count'     => \App\Models\Driver::whereHas('bus', fn($q) => $q->where('school_id', $school->id))->count(),
            'assistants_count'  => (int) ($busStats->assistants_count ?? 0),
            'admins_count'      => $school->schoolAdmins->count(),
        ];

        return Inertia::render('Admin/Schools/Show', [
            'school' => $school,
            'stats'  => $stats
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
            ->with('success', 'School updated successfully');
    }

    public function destroy(School $school)
    {
        $school->delete();

        return redirect()->route('admin.schools.index')
            ->with('success', 'School deleted successfully');
    }

    public function toggleStatus(School $school)
    {
        $school->status = $school->status === 'Active' ? 'Inactive' : 'Active';
        $school->save();

        return back()->with('success', 'تم تحديث حالة المدرسة بنجاح');
    }
}


