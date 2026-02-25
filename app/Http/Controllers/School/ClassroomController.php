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
        $schoolId = Auth::user()->school_id;
        $classrooms = Classroom::where('school_id', $schoolId)
            ->with(['teachers:id,name,national_id']) // load supervisors with national_id for search
            ->orderBy('name')
            ->get(['id', 'name', 'grade_level']);

        return response()->json($classrooms);
    }

    // عرض صفحة الفصول
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $schoolId = $user->school_id;
        $search = $request->input('search');

        $classrooms = Classroom::where('school_id', $schoolId)
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('grade_level', 'like', "%{$search}%");
            })
            ->latest()
            ->with('teachers') // Eager load teachers to display supervisor
            ->get();

        // Fetch teachers to populate the dropdown
        $teachers = User::where('school_id', $schoolId)
            ->where('role', 'teacher')
            ->orderBy('name')
            ->get(['id', 'name']);

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

        if ($classroom->school_id !== $user->school_id) {
            abort(403);
        }

        $teachers = User::query()
            ->where('school_id', $user->school_id)
            ->where('role', 'teacher') // Show teachers
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
            'teacher_id' => 'nullable|exists:users,id', // Added validation
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        $classroom = Classroom::create([
            'name' => $request->name,
            'grade_level' => $request->grade_level,
            'school_id' => $user->school_id, // ✅ استخدام المتغير المعرف
        ]);

        // Attach teacher if selected
        if ($request->teacher_id) {
            $classroom->teachers()->attach($request->teacher_id, ['school_id' => $user->school_id]);
        }

        return redirect()->back()->with('success', 'Class created successfully');
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
