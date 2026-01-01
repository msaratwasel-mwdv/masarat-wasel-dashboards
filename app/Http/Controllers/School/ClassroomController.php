<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ClassroomController extends Controller
{
    // عرض صفحة الفصول
    public function index()
    {
        // ✅ 2. استخدمنا Auth بدلاً من auth() لإخفاء الخطأ
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $schoolId = $user->school_id;

        $classrooms = Classroom::where('school_id', $schoolId)
            ->latest()
            ->get();

        return Inertia::render('School/Classrooms/Index', [
            'classrooms' => $classrooms->load('teachers:id,name,email'),
        ]);
    }

    // عرض صفحة تعديل الفصل وربط المعلمين
    public function edit(Classroom $classroom)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($classroom->school_id !== $user->school_id) {
            abort(403);
        }

        $teachers = User::query()
            ->where('school_id', $user->school_id)
            ->where('role', 'teacher')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('School/Classrooms/Edit', [
            'classroom' => $classroom->load('teachers:id,name,email'),
            'teachers' => $teachers,
        ]);
    }

    // تحديث بيانات الفصل وربط المعلمين
    public function update(Request $request, Classroom $classroom)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($classroom->school_id !== $user->school_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'grade_level' => 'nullable|string|max:255',
            'teacher_ids' => 'array',
            'teacher_ids.*' => 'integer|exists:users,id',
        ]);

        $classroom->update([
            'name' => $validated['name'],
            'grade_level' => $validated['grade_level'] ?? null,
        ]);

        // ربط المعلمين (فقط معلمين نفس المدرسة)
        $teacherIds = collect($validated['teacher_ids'] ?? [])->unique()->values();
        $teacherIds = User::query()
            ->where('school_id', $user->school_id)
            ->where('role', 'teacher')
            ->whereIn('id', $teacherIds)
            ->pluck('id')
            ->all();

        $syncData = [];
        foreach ($teacherIds as $tid) {
            $syncData[$tid] = ['school_id' => $user->school_id];
        }
        $classroom->teachers()->sync($syncData);

        return redirect()->route('school.classrooms.index')->with('success', 'Class updated successfully');
    }

    // حفظ فصل جديد
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'grade_level' => 'nullable|string|max:255',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        Classroom::create([
            'name' => $request->name,
            'grade_level' => $request->grade_level,
            'school_id' => $user->school_id, // ✅ استخدام المتغير المعرف
        ]);

        return redirect()->back();
    }

    // حذف فصل
    public function destroy(Classroom $classroom)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($classroom->school_id !== $user->school_id) {
            abort(403);
        }

        $classroom->delete();

        return redirect()->back()->with('message', 'تم حذف الفصل بنجاح');
    }
}
