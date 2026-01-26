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
        // لم نعد نحتاج لكتابة $request->validate(...) هنا!
        // لارافل قام بالتحقق قبل دخول هذه الدالة أصلاً.

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => 'school_admin',
            'school_id' => $school->id,
            'user_code' => 'SCH-' . rand(1000, 9999),
            'status' => 'active',
        ]);

        return redirect()->route('admin.schools.show', $school->id)
            ->with('message', 'تم تعيين مدير للمدرسة بنجاح');
    }

    // عرض صفحة تعديل مدير المدرسة
    public function edit(School $school, User $user)
    {
        // التأكد من أن المستخدم تابع لهذه المدرسة
        if ($user->school_id !== $school->id) {
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
        if ($user->school_id !== $school->id) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone' => 'required|string|max:20',
            'password' => 'nullable|min:8',
        ]);

        $updateData = [
            'name' => $validated['name'],
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
        if ($user->school_id !== $school->id) {
            abort(403, 'Unauthorized action.');
        }

        $user->delete();

        return redirect()->route('admin.schools.show', $school->id)
            ->with('message', 'تم حذف المدير بنجاح');
    }
}
