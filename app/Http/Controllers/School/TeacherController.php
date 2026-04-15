<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Classroom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TeacherController extends Controller
{
    /**
     * عرض قائمة المشرفين (مع بحث)
     */
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $search = $request->input('search');

        $teachers = User::whereHas('teacher', fn($q) => $q->where('teachers.school_id', $user->getSchoolId()))
            ->whereHas('roles', fn($q) => $q->where('roles.name', 'teacher'))
            ->with(['teacher.classroom']) // Eager load classroom
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name_ar', 'like', "%{$search}%")
                        ->orWhere('last_name_ar', 'like', "%{$search}%")
                        ->orWhere('national_id', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'first_name_ar' => $u->first_name_ar,
                    'last_name_ar' => $u->last_name_ar,
                    'national_id' => $u->national_id,
                    'email' => $u->email,
                    'phone' => $u->phone,
                    'classroom_id' => $u->teacher?->classroom_id,
                    'classroom_name' => $u->teacher?->classroom?->name,
                ];
            });

        $classrooms = Classroom::where('school_id', $user->getSchoolId())->get(['id', 'name']);

        return Inertia::render('School/Teachers/Index', [
            'teachers' => $teachers,
            'classrooms' => $classrooms,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Fallback for show route to avoid GET method errors
     */
    public function show()
    {
        return redirect()->route('school.teachers.index');
    }

    /**
     * إنشاء مشرف جديد
     */
    public function store(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'national_id' => ['required', 'string', 'max:20', Rule::unique('users', 'national_id')],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['required', 'string', 'max:50', Rule::unique('users', 'phone')],
            'password' => 'nullable|string|min:6',
            'classroom_id' => 'nullable|exists:classrooms,id',
        ]);

        DB::transaction(function() use ($validated, $user) {
            [$first, $second, $third, $last] = User::parseFullName($validated['name']);
            
            $teacherUser = User::create([
                'first_name_ar'  => $first,
                'second_name_ar' => $second,
                'third_name_ar'  => $third,
                'last_name_ar'   => $last,
                'first_name_en'  => '',
                'second_name_en' => '',
                'third_name_en'  => '',
                'last_name_en'   => '',
                'national_id' => $validated['national_id'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make(
                    $validated['password'] ?? $validated['phone']
                ),
            ]);

            // Assign role
            $teacherRole = \App\Models\Role::firstOrCreate(['name' => 'teacher']);
            $teacherUser->roles()->attach($teacherRole->id);

            // Create Teacher extension record
            \App\Models\Teacher::create([
                'user_id' => $teacherUser->id,
                'school_id' => $user->getSchoolId(),
                'classroom_id' => $validated['classroom_id'] ?? null,
                'status' => 'active',
            ]);
        });

        return redirect()
            ->back()
            ->with('success', 'Teacher created successfully.');
    }

    /**
     * عرض صفحة تعديل مشرف
     */
    public function edit(User $teacher)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 🔐 حماية: لا تعدّل مشرف من مدرسة ثانية
        if (
            $teacher->getSchoolId() !== $user->getSchoolId() ||
            !$teacher->hasRole('teacher')
        ) {
            abort(403);
        }

        $classrooms = Classroom::where('school_id', $user->getSchoolId())->get(['id', 'name']);

        return Inertia::render('School/Teachers/Edit', [
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'national_id' => $teacher->national_id,
                'email' => $teacher->email,
                'phone' => $teacher->phone,
                'classroom_id' => $teacher->teacher?->classroom_id,
            ],
            'classrooms' => $classrooms,
        ]);
    }

    /**
     * تحديث بيانات مشرف
     */
    public function update(Request $request, User $teacher)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (
            $teacher->getSchoolId() !== $user->getSchoolId() ||
            !$teacher->hasRole('teacher')
        ) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'national_id' => [
                'required',
                'string',
                'max:20',
                Rule::unique('users', 'national_id')->ignore($teacher->id),
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($teacher->id),
            ],
            'phone' => ['required', 'string', 'max:50', Rule::unique('users', 'phone')->ignore($teacher->id)],
            'password' => 'nullable|string|min:6',
            'classroom_id' => 'nullable|exists:classrooms,id',
        ]);

        [$first, $second, $third, $last] = User::parseFullName($validated['name']);

        $teacher->update([
            'first_name_ar'  => $first,
            'second_name_ar' => $second,
            'third_name_ar'  => $third,
            'last_name_ar'   => $last,
            'national_id' => $validated['national_id'],
            'email'       => $validated['email'] ?? null,
            'phone'       => $validated['phone'],
        ]);

        // تحديث كلمة المرور إذا أُدخلت
        if (!empty($validated['password'])) {
            $teacher->update(['password' => Hash::make($validated['password'])]);
        }

        // تحديث الفصل والمدرسة
        if ($teacher->teacher) {
            $teacher->teacher->update([
                'classroom_id' => $validated['classroom_id'] ?? null,
                'school_id' => $user->getSchoolId()
            ]);
        } else {
            \App\Models\Teacher::create([
                'user_id' => $teacher->id,
                'school_id' => $user->getSchoolId(),
                'classroom_id' => $validated['classroom_id'] ?? null,
            ]);
        }

        return redirect()
            ->route('school.teachers.index')
            ->with('success', 'Teacher updated successfully.');
    }

    /**
     * حذف مشرف
     */
    public function destroy(User $teacher)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (
            $teacher->getSchoolId() !== $user->getSchoolId() ||
            !$teacher->hasRole('teacher')
        ) {
            abort(403);
        }

        $teacher->delete();

        return redirect()
            ->route('school.teachers.index')
            ->with('success', 'Teacher deleted successfully.');
    }
}



