<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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

        $teachers = User::query()
            ->where('school_id', $user->school_id)
            ->where('role', 'supervisor')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('national_id', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('School/Teachers/Index', [
            'teachers' => $teachers,
            'filters' => $request->only(['search']),
        ]);
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
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'string', 'max:50', Rule::unique('users', 'phone')],
            'password' => 'nullable|string|min:6',
        ]);

        User::create([
            'name' => $validated['name'],
            'national_id' => $validated['national_id'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make(
                $validated['password'] ?? $validated['national_id']
            ),
            'role' => 'supervisor',
            'school_id' => $user->school_id,
            'is_active' => true,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Supervisor created successfully.');
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
            $teacher->school_id !== $user->school_id ||
            $teacher->role !== 'supervisor'
        ) {
            abort(403);
        }

        return Inertia::render('School/Teachers/Edit', [
            'teacher' => $teacher,
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
            $teacher->school_id !== $user->school_id ||
            $teacher->role !== 'supervisor'
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
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($teacher->id),
            ],
            'phone' => ['nullable', 'string', 'max:50'],
            'is_active' => 'required|boolean',
        ]);

        $teacher->update($validated);

        return redirect()
            ->route('school.teachers.index')
            ->with('success', 'Supervisor updated successfully.');
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
            $teacher->role !== 'supervisor'
        ) {
            abort(403);
        }

        $teacher->delete();

        return redirect()
            ->route('school.teachers.index')
            ->with('success', 'Supervisor deleted successfully.');
    }
}
