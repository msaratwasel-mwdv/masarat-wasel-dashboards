<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSchoolUserRequest;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class SchoolUserController extends Controller
{
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
            $en = \App\Models\User::parseFullName($request->name_en);

            $user = User::create([
                'first_name_ar' => $ar[0],
                'second_name_ar' => $ar[1],
                'third_name_ar' => $ar[2],
                'last_name_ar' => $ar[3] ?: $ar[0],
                'first_name_en' => $en[0],
                'second_name_en' => $en[1],
                'third_name_en' => $en[2],
                'last_name_en' => $en[3],
                'email' => $request->email,
                'phone' => $request->phone,
                'national_id' => $request->national_id ?? '0000000000',
                'password' => Hash::make($request->password),
                'is_active' => true,
            ]);

            // Attach role via user_roles pivot
            $role = \App\Models\Role::firstOrCreate(['name' => 'school_admin']);
            $user->roles()->attach($role->id);

            // Create SchoolAdmin extension record (links user to school)
            \App\Models\SchoolAdmin::create([
                'user_id' => $user->id,
                'school_id' => $school->id,
            ]);
        });

        return redirect()->route('admin.schools.show', $school->id)
            ->with('message', 'تم تعيين مدير للمدرسة بنجاح');
    }

    // عرض صفحة تعديل مدير المدرسة
    public function edit(School $school, User $user)
    {
        // التأكد من أن المستخدم تابع لهذه المدرسة
        if ($user->getSchoolId() !== $school->id) {
            abort(403, 'Unauthorized action.');
        }

        return Inertia::render('Admin/SchoolUsers/Edit', [
            'school' => $school,
            'user' => $user
        ]);
    }

    // تحديث بيانات مدير المدرسة
    public function update(Request $request, School $school, User $user)
    {
        // التأكد من أن المستخدم تابع لهذه المدرسة
        if ($user->getSchoolId() !== $school->id) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone' => 'required|string|max:20',
            'password' => 'nullable|min:8',
        ]);

        $ar = \App\Models\User::parseFullName($validated['name']);
        
        $updateData = [
            'first_name_ar' => $ar[0],
            'second_name_ar' => $ar[1],
            'third_name_ar' => $ar[2],
            'last_name_ar' => $ar[3] ?: $ar[0],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
        ];

        // تحديث كلمة المرور فقط إذا تم إدخالها
        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return redirect()->route('admin.schools.show', $school->id)
            ->with('message', 'تم تحديث بيانات المدير بنجاح');
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
}


