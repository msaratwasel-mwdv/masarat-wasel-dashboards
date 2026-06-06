<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSchoolUserRequest;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SchoolUserController extends Controller
{
    use \App\Traits\DataTableTrait;

    // عرض قائمة جميع مدراء المدارس
    public function index(Request $request)
    {
        $query = User::withRole('school_admin')
            ->with(['roles', 'schoolAdmin.school']);

        $paginated = $this->applyDataTable($query, $request, [
            'name',
            'email',
            'phone',
            'national_id',
            'schoolAdmin.school.name'
        ], 15);

        if ($paginated instanceof \Symfony\Component\HttpFoundation\Response) {
            return $paginated;
        }

        $counts = \Illuminate\Support\Facades\Cache::remember('school_user_counts', 600, function() {
            $ids = DB::table('user_roles')->join('roles','user_roles.role_id','=','roles.id')
                ->where('roles.name','school_admin')->pluck('user_roles.user_id');
            $activeCount = DB::table('school_admins')->whereIn('user_id',$ids)->where('status','active')->count();
            $total = $ids->count();
            return ['all'=>$total,'active'=>$activeCount,'inactive'=>$total-$activeCount];
        });

        return Inertia::render('Admin/SchoolUsers/Index', [
            'users' => $paginated,
            'counts' => $counts,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', 'all')
            ],
            'schools' => School::select('id', 'name')->orderBy('name')->get()
        ]);
    }

    // عرض صفحة إضافة مدير لمدرسة معينة (Legacy support)
    public function create(School $school)
    {
        return Inertia::render('Admin/SchoolUsers/Create', [
            'school' => $school
        ]);
    }

    // حفظ المدير الجديد
    public function store(StoreSchoolUserRequest $request, ?School $school = null)
    {
        $schoolId = $school ? $school->id : $request->school_id;

        if (!$schoolId) {
            return back()->withErrors(['school_id' => 'يجب تحديد مدرسة لربط المدير بها.']);
        }

        // Cache role ID
        static $roleId = null;
        if (!$roleId) {
            $roleId = \App\Models\Role::where('name', 'school_admin')->value('id')
                   ?? \App\Models\Role::create(['name' => 'school_admin'])->id;
        }

        DB::transaction(function () use ($request, $schoolId, $roleId) {
            $ar = User::parseFullName($request->name ?: '');
            $enName = $request->name_en ?: $request->name ?: '';
            $en = User::parseFullName($enName);

            $user = User::create([
                'first_name_ar' => $request->first_name_ar ?? $ar[0],
                'last_name_ar' => $request->last_name_ar ?? ($ar[3] ?: $ar[0]),
                'first_name_en' => $request->first_name_en ?? $en[0],
                'last_name_en' => $request->last_name_en ?? ($en[3] ?: $en[0]),
                'email' => $request->email,
                'phone' => $request->phone,
                'national_id' => $request->national_id,
                'address' => $request->address,
                'password' => Hash::make($request->password),
                'image' => $request->hasFile('image') ? $request->file('image')->store('users/images', 'public') : null,
            ]);

            $user->roles()->syncWithoutDetaching([$roleId]);

            \App\Models\SchoolAdmin::create([
                'user_id' => $user->id,
                'school_id' => $schoolId,
            ]);
        });

        return back()->with('success', 'تم إضافة مدير المدرسة بنجاح');
    }

    // تحديث بيانات مدير المدرسة
    public function update(StoreSchoolUserRequest $request, User $user, ?School $school = null)
    {
        $ar = User::parseFullName($request->name ?: '');
        $enName = $request->name_en ?: $request->name ?: '';
        $en = User::parseFullName($enName);
        
        $updateData = [
            'first_name_ar' => $request->first_name_ar ?? $ar[0],
            'last_name_ar' => $request->last_name_ar ?? ($ar[3] ?: $ar[0]),
            'first_name_en' => $request->first_name_en ?? $en[0],
            'last_name_en' => $request->last_name_en ?? ($en[3] ?: $en[0]),
            'email' => $request->email,
            'phone' => $request->phone,
            'national_id' => $request->national_id,
            'address' => $request->address,
        ];

        if ($request->hasFile('image')) {
            if ($user->image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->image);
            }
            $updateData['image'] = $request->file('image')->store('users/images', 'public');
        }

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        // Update school link if school_id is provided
        if ($request->filled('school_id')) {
            \App\Models\SchoolAdmin::updateOrCreate(
                ['user_id' => $user->id],
                ['school_id' => $request->school_id]
            );
        }

        return back()->with('success', 'تم تحديث بيانات المدير بنجاح');
    }

    // حذف مدير المدرسة
    public function destroy(User $user, ?School $school = null)
    {
        $user->delete();
        return back()->with('success', 'تم حذف المدير بنجاح');
    }

    public function export()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\SchoolUsersExport(false), 'school_admins.xlsx');
    }

    public function downloadTemplate()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\SchoolUsersExport(true), 'school_admins_template.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
        ]);

        $import = new \App\Imports\SchoolUsersImport();
        \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));

        return redirect()->back()->with('success', "تم استيراد مدراء المدارس بنجاح وتحديث القائمة.");
    }
}
