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

        $classrooms->each(function($c) {
            if ($c->teacher) {
                return [
                    'user_id' => $c->teacher->user_id,
                    'name' => $c->teacher->name,
                ];
            }
        });

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
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('grade_level', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->with(['teachers.user']) 
            ->get()
            ->map(function($c) {
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'grade_level' => $c->grade_level,
                    'school_id' => $c->school_id,
                    'teachers' => $c->teachers->map(function($t) {
                        return [
                            'user_id' => $t->user_id,
                            'name' => $t->name, // Uses the model name accessor once here
                        ];
                    })
                ];
            });

        // Fetch teachers to populate the dropdown - Using map to break any ties to the model appends
        $teachers = User::whereHas('teacher', fn($q) => $q->where('school_id', $schoolId))
            ->whereHas('roles', fn($q) => $q->where('name', 'teacher'))
            ->orderBy('first_name_ar')
            ->get()
            ->map(function($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name, // Calculate name string once
                    'email' => $u->email,
                ];
            });

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

        $teachers = User::whereHas('teacher', fn($q) => $q->where('school_id', $user->getSchoolId()))
            ->whereHas('roles', fn($q) => $q->where('name', 'teacher'))
            ->where('is_active', true)
            ->orderBy('first_name_ar')
            ->get()
            ->map(function($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                ];
            });

        return Inertia::render('School/Classrooms/Edit', [
            'classroom' => [
                'id' => $classroom->id,
                'name' => $classroom->name,
                'grade_level' => $classroom->grade_level,
                'school_id' => $classroom->school_id,
                'teachers' => $classroom->teachers->map(function($t) {
                    return [
                        'user_id' => $t->user_id,
                        'name' => $t->name,
                    ];
                })
            ],
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



