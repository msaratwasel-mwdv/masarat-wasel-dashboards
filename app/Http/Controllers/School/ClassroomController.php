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
    // [API] Fetch all classes for dropdowns
    public function apiIndex()
    {
        $schoolId = Auth::user()->getSchoolId();
        $classrooms = Classroom::where('school_id', $schoolId)
            ->with(['teacher.user']) // load teacher user
            ->orderBy('name')
            ->get(['id', 'name', 'grade_level']);

        return response()->json($classrooms);
    }

    // عرض صفحة الفصول
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $schoolId = $user->getSchoolId();
        $search = $request->input('search');

        $classrooms = Classroom::where('school_id', $schoolId)
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('grade_level', 'like', "%{$search}%");
            })
            ->latest()
            ->with('teachers.user') // Eager load teachers with their user details
            ->get();

        // Fetch teachers to populate the dropdown
        $teachers = User::atSchool($schoolId)
            ->whereHas('roles', fn($q) => $q->where('name', 'teacher'))
            ->orderBy('first_name_ar')
            ->get(['id', 'first_name_ar', 'last_name_ar', 'email']);

        return Inertia::render('School/Classrooms/Index', [
            'classrooms' => $classrooms,
            'teachers' => $teachers,
            'filters' => $request->only(['search']),
        ]);
    }

    // عرض صفحة تعديل الفصل وربط المعلمين
    public function edit(Classroom $classroom)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($classroom->school_id !== $user->getSchoolId()) {
            abort(403);
        }

        $teachers = User::query()
            ->atSchool($user->getSchoolId())
            ->whereHas('roles', fn($q) => $q->where('name', 'teacher')) // Show teachers
            ->where('is_active', true)
            ->orderBy('first_name_ar')
            ->get(['id', 'first_name_ar', 'last_name_ar', 'email']);

        return Inertia::render('School/Classrooms/Edit', [
            'classroom' => $classroom->load('teacher.user'),
            'teachers' => $teachers,
        ]);
    }

    // تحديث بيانات الفصل وربط المعلمين
    public function update(Request $request, Classroom $classroom)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($classroom->school_id !== $user->getSchoolId()) {
            abort(403);
        }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'grade_level' => 'nullable|string|max:255',
            'teacher_id' => 'nullable|integer|exists:users,id',
            'teacher_ids' => 'nullable|array',
            'teacher_ids.*' => 'exists:users,id',
        ]);

        $classroom->update([
            'name' => $validated['name'],
            'grade_level' => $validated['grade_level'] ?? $classroom->grade_level,
        ]);

        // ربط المعلم
        // أولاً: تصفير أي معلم مرتبط بهذا الفصل حالياً
        \App\Models\Teacher::where('classroom_id', $classroom->id)->update(['classroom_id' => null]);
        
        // ثانياً: جمع كل المعرفات المطلوب ربطها
        $teacherIds = [];
        if (!empty($validated['teacher_id'])) {
            $teacherIds[] = $validated['teacher_id'];
        }
        if (!empty($validated['teacher_ids'])) {
            $teacherIds = array_merge($teacherIds, $validated['teacher_ids']);
        }
        $teacherIds = array_unique($teacherIds);

        foreach ($teacherIds as $id) {
            \App\Models\Teacher::updateOrCreate(
                ['user_id' => $id],
                [
                    'classroom_id' => $classroom->id,
                    'school_id' => $user->getSchoolId()
                ]
            );
        }

        return redirect()->route('school.classrooms.index')->with('success', 'Class updated successfully');
    }

    // حفظ فصل جديد
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'grade_level' => 'nullable|string|max:255',
            'teacher_id' => 'nullable|exists:users,id', // Added validation
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        $classroom = Classroom::create([
            'name' => $request->name,
            'grade_level' => $request->grade_level,
            'school_id' => $user->getSchoolId(), // ✅ استخدام المتغير المعرف
        ]);

        // Attach teacher if selected
        if ($request->teacher_id) {
            \App\Models\Teacher::updateOrCreate(
                ['user_id' => $request->teacher_id],
                [
                    'classroom_id' => $classroom->id,
                    'school_id' => $user->getSchoolId()
                ]
            );
        }

        return redirect()->back()->with('success', 'Class created successfully');
    }

    // حذف فصل
    public function destroy(Classroom $classroom)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($classroom->school_id !== $user->getSchoolId()) {
            abort(403);
        }

        $classroom->delete();

        return redirect()->back()->with('message', 'تم حذف الفصل بنجاح');
    }
}



