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
    // عرض قائمة جميع مدراء المدارس
    public function index(Request $request)
    {
        $query = User::withRole('school_admin')->with('schoolAdmin.school');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('first_name_ar', 'like', "%{$search}%")
                  ->orWhere('last_name_ar', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate(10)->withQueryString();

        return Inertia::render('Admin/SchoolUsers/Index', [
            'users' => $users,
            'filters' => $request->only(['search'])
        ]);
    }

    // عرض صفحة إضافة مدير لمدرسة معينة
    public function create(School $school)
    {
        return Inertia::render('Admin/SchoolUsers/Create', [
            'school' => $school // نرسل بيانات المدرسة للواجهة لنعرض اسمها
        ]);
    }


    // حفظ المدير الجديد
    public function store(StoreSchoolUserRequest $request, School $school)
    {
        DB::transaction(function () use ($request, $school) {
            $ar = \App\Models\User::parseFullName($request->name);
            // Fallback for name_en if not provided
            $enName = $request->name_en ?: $request->name;
            $en = \App\Models\User::parseFullName($enName);

            $user = User::create([
                'first_name_ar' => $ar[0],
                'second_name_ar' => $ar[1],
                'third_name_ar' => $ar[2],
                'last_name_ar' => $ar[3] ?: $ar[0],
                'first_name_en' => $en[0],
                'second_name_en' => $en[1],
                'third_name_en' => $en[2],
                'last_name_en' => $en[3] ?: $en[0],
                'email' => $request->email,
                'phone' => $request->phone,
                'national_id' => $request->national_id,
                'address' => $request->address,
                'password' => Hash::make($request->password),
                'image' => $request->hasFile('image') ? $request->file('image')->store('users/images', 'public') : null,
            ]);

            // Attach role safely
            $role = \App\Models\Role::firstOrCreate(['name' => 'school_admin']);
            $user->roles()->syncWithoutDetaching([$role->id]);

            // Create SchoolAdmin link
            \App\Models\SchoolAdmin::updateOrCreate(
                ['user_id' => $user->id],
                ['school_id' => $school->id]
            );
        });

        return back()->with('message', 'تم تعيين مدير للمدرسة بنجاح');
    }

    // تحديث بيانات مدير المدرسة
    public function update(StoreSchoolUserRequest $request, School $school, User $user)
    {
        // التأكد من أن المستخدم تابع لهذه المدرسة
        if ($user->getSchoolId() !== $school->id) {
            abort(403, 'Unauthorized action.');
        }

        $ar = \App\Models\User::parseFullName($request->name);
        $enName = $request->name_en ?: $request->name;
        $en = \App\Models\User::parseFullName($enName);
        
        $updateData = [
            'first_name_ar' => $ar[0],
            'second_name_ar' => $ar[1],
            'third_name_ar' => $ar[2],
            'last_name_ar' => $ar[3] ?: $ar[0],
            'first_name_en' => $en[0],
            'second_name_en' => $en[1],
            'third_name_en' => $en[2],
            'last_name_en' => $en[3] ?: $en[0],
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

        return back()->with('message', 'تم تحديث بيانات المدير بنجاح');
    }

    // حذف مدير المدرسة
    public function destroy(School $school, User $user)
    {
        // التأكد من أن المستخدم تابع لهذه المدرسة
        if ($user->getSchoolId() !== $school->id) {
            abort(403, 'Unauthorized action.');
        }

        $user->delete();

        return redirect()->route('admin.schools.show', $school->id)
            ->with('message', 'تم حذف المدير بنجاح');
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
