<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
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
        $schoolId = $user->school_id;
        $search = $request->input('search');

        $teachers = User::query()
            ->atSchool($schoolId)
            ->withRole('teacher')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name_ar', 'like', "%{$search}%")
                        ->orWhere('last_name_ar', 'like', "%{$search}%")
                        ->orWhere('national_id', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->with(['teacher.grade']) 
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($u) {
                $u->grade_id = $u->teacher?->grade_id;
                $u->grade_name = $u->teacher?->grade?->name;
                return $u;
            });

        $counts = [
            'all' => $teachers->count(),
            'active' => $teachers->where('is_active', true)->count(),
            'inactive' => $teachers->where('is_active', false)->count(),
        ];

        return Inertia::render('School/Teachers/Index', [
            'teachers' => $teachers,
            'counts' => $counts,
            'filters' => $request->only(['search']),
            'grades' => \App\Models\Grade::where('school_id', $schoolId)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * إنشاء معلم جديد
     */
    public function store(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $validated = $request->validate([
            'first_name_ar' => 'required|string|max:255',
            'second_name_ar' => 'nullable|string|max:255',
            'third_name_ar' => 'nullable|string|max:255',
            'last_name_ar' => 'required|string|max:255',
            'first_name_en' => 'nullable|string|max:255',
            'second_name_en' => 'nullable|string|max:255',
            'third_name_en' => 'nullable|string|max:255',
            'last_name_en' => 'nullable|string|max:255',
            'national_id' => ['required', 'string', 'max:20', Rule::unique('users', 'national_id')],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['required', 'string', 'max:50', Rule::unique('users', 'phone')],
            'password' => 'nullable|string|min:6',
            'is_active' => 'required|boolean',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'grade_id' => [
                'nullable',
                'exists:grades,id',
                Rule::unique('teachers', 'grade_id'),
            ],
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('teachers', 'public');
        }

        \DB::transaction(function() use ($validated, $user, $imagePath) {
            $teacherUser = User::create([
                'first_name_ar' => $validated['first_name_ar'],
                'second_name_ar' => $validated['second_name_ar'] ?? '',
                'third_name_ar' => $validated['third_name_ar'] ?? '',
                'last_name_ar' => $validated['last_name_ar'],
                'first_name_en' => $validated['first_name_en'] ?? '',
                'second_name_en' => $validated['second_name_en'] ?? '',
                'third_name_en' => $validated['third_name_en'] ?? '',
                'last_name_en' => $validated['last_name_en'] ?? '',
                'national_id' => $validated['national_id'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make(
                    $validated['password'] ?? $validated['phone']
                ),
                'is_active' => $validated['is_active'],
                'image' => $imagePath,
            ]);

            // Attach role
            $role = \App\Models\Role::firstOrCreate(['name' => 'teacher']);
            $teacherUser->roles()->attach($role->id);

            // Create teacher record
            \App\Models\Teacher::create([
                'user_id' => $teacherUser->id,
                'school_id' => $user->school_id,
                'grade_id' => $validated['grade_id'] ?? null,
                'status' => 'active',
            ]);
        });

        return redirect()
            ->route('school.teachers.index')
            ->with('success', 'Teacher created successfully.');
    }

    /**
     * تحديث بيانات معلم
     */
    public function update(Request $request, User $teacher)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (
            $teacher->school_id !== $user->school_id ||
            !$teacher->hasRole('teacher')
        ) {
            abort(403);
        }

        $validated = $request->validate([
            'first_name_ar' => 'required|string|max:255',
            'second_name_ar' => 'nullable|string|max:255',
            'third_name_ar' => 'nullable|string|max:255',
            'last_name_ar' => 'required|string|max:255',
            'first_name_en' => 'nullable|string|max:255',
            'second_name_en' => 'nullable|string|max:255',
            'third_name_en' => 'nullable|string|max:255',
            'last_name_en' => 'nullable|string|max:255',
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
            'is_active' => 'required|boolean',
            'password' => 'nullable|string|min:6',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'grade_id' => [
                'nullable',
                'exists:grades,id',
                Rule::unique('teachers', 'grade_id')->ignore($teacher->id, 'user_id'),
            ],
        ]);

        $updateData = [
            'first_name_ar' => $validated['first_name_ar'],
            'second_name_ar' => $validated['second_name_ar'] ?? '',
            'third_name_ar' => $validated['third_name_ar'] ?? '',
            'last_name_ar' => $validated['last_name_ar'],
            'first_name_en' => $validated['first_name_en'] ?? '',
            'second_name_en' => $validated['second_name_en'] ?? '',
            'third_name_en' => $validated['third_name_en'] ?? '',
            'last_name_en' => $validated['last_name_en'] ?? '',
            'national_id'    => $validated['national_id'],
            'email'          => $validated['email'] ?? null,
            'phone'          => $validated['phone'],
            'is_active'      => $validated['is_active'],
        ];

        // معالجة رفع الصورة
        if ($request->hasFile('image')) {
            if ($teacher->image) {
                Storage::disk('public')->delete($teacher->image);
            }
            $updateData['image'] = $request->file('image')->store('teachers', 'public');
        }

        $teacher->update($updateData);

        // تحديث كلمة المرور إذا أُدخلت
        if (!empty($validated['password'])) {
            $teacher->update(['password' => Hash::make($validated['password'])]);
        }

        // تحديث المرحلة في بروفايل المعلم
        if ($teacher->teacher) {
            $teacher->teacher->update([
                'grade_id' => $validated['grade_id'] ?? null,
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
            $teacher->school_id !== $user->school_id ||
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
