<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSchoolRequest;
use App\Models\School;
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
            'plans' => \App\Models\Plan::active()->orderBy('sort_order')->get(),
        ]);
    }

    public function store(StoreSchoolRequest $request)
    {
        return DB::transaction(function () use ($request) {
            $data = $request->validated();

            if ($request->hasFile('logo')) {
                $data['logo'] = $request->file('logo')->store('schools/logos', 'public');
            }

            // Default service flags
            $data['has_transport'] = true;
            $data['has_attendance'] = true;

            $school = School::create($data);

            // Create admin if requested and email provided
            if ($request->boolean('create_admin') && ! empty($request->admin_email)) {
                $ar = \App\Models\User::parseFullName($request->admin_name);

                $adminData = [
                    'first_name_ar' => $ar[0] ?: 'مدير',
                    'last_name_ar' => $ar[3] ?: ($ar[0] ?: 'المدرسة'),
                    'first_name_en' => $ar[0] ?: 'School',
                    'last_name_en' => $ar[3] ?: 'Admin',
                    'email' => $request->admin_email,
                    'phone' => $request->admin_phone,
                    'national_id' => $request->admin_national_id ?: ('SA'.rand(10000000, 99999999)),
                    'password' => \Illuminate\Support\Facades\Hash::make($request->admin_password),
                    'is_whatsapp_active' => true,
                ];

                $user = \App\Models\User::create($adminData);

                $role = \App\Models\Role::firstOrCreate(['name' => 'school_admin'], ['display_name' => 'مدير مدرسة']);
                $user->roles()->syncWithoutDetaching([$role->id]);

                \App\Models\SchoolAdmin::create([
                    'user_id' => $user->id,
                    'school_id' => $school->id,
                ]);
            }

            // Subscription handling
            if ($request->filled('plan_id')) {
                $plan = \App\Models\Plan::find($request->plan_id);
                if ($plan) {
                    \App\Models\Subscription::create([
                        'school_id' => $school->id,
                        'plan_id' => $plan->id,
                        'status' => 'active',
                        'start_date' => now()->toDateString(),
                        'end_date' => now()->addYear()->toDateString(),
                        'notes' => [
                            'billing_type' => 'yearly',
                            'student_count' => 0,
                            'bus_count' => 0,
                            'preferred_lang' => 'ar',
                            'custom_notes' => 'تم إنشاء الاشتراك وتفعيله آلياً عند تسجيل المدرسة.',
                        ],
                    ]);
                    $school->update(['plan_id' => $plan->id]);
                }
            }

            return redirect()->route('admin.schools.index')
                ->with('success', 'تم إنشاء المدرسة بنجاح'.($request->boolean('create_admin') ? ' وتعيين مديرها' : ''));
        });
    }

    public function show(School $school)
    {
        // ⚡ Eager load admins + their users in 2 queries instead of N+1
        $school->load('schoolAdmins.user');

        $school->users = $school->schoolAdmins->map(function ($sa) {
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
            'students_count' => \App\Models\Student::inSchool($school->id)->count(),
            'buses_count' => (int) ($busStats->total ?? 0),
            'active_buses' => (int) ($busStats->active_count ?? 0),
            'maintenance_buses' => (int) ($busStats->maintenance_count ?? 0),
            'drivers_count' => \App\Models\Driver::whereHas('bus', fn ($q) => $q->where('school_id', $school->id))->count(),
            'assistants_count' => (int) ($busStats->assistants_count ?? 0),
            'admins_count' => $school->schoolAdmins->count(),
        ];

        return Inertia::render('Admin/Schools/Show', [
            'school' => $school,
            'stats' => $stats,
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
        $schoolName = $school->name;
        $school->delete();

        try {
            app(\App\Services\NotificationService::class)->notifyCompanyAdmins(
                'school_deleted',
                '🏢 حذف مدرسة',
                "تم حذف مدرسة: {$schoolName} من النظام",
                ['school_name' => $schoolName]
            );
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to notify admins on school deletion: '.$e->getMessage());
        }

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
