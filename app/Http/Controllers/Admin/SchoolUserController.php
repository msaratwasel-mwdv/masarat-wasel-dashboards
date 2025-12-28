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

        return redirect()->route('admin.schools.index')
        ->with('message', 'تم تعيين مدير للمدرسة بنجاح');
    }

   
}
