<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\Grade;
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
        $classrooms = Classroom::atSchool($schoolId)
            ->with(['grade', 'teachers.user'])
            ->orderBy('name')
            ->get(['id', 'name', 'grade_id']);

        $classrooms->transform(function($c) {
            $mappedTeachers = $c->teachers->map(function($t) {
                return [
                    'id' => $t->user_id,
                    'name' => $t->name,
                    'national_id' => $t->user ? $t->user->national_id : null,
                ];
            });
            
            $c->setRelation('teachers', $mappedTeachers);
            $c->supervisor = $mappedTeachers->first();
            
            return $c;
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

        $classrooms = Classroom::atSchool($schoolId)
            ->when($search, function ($query, $search) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->with(['grade', 'teachers.user']) 
            ->withCount('students')
            ->get()
            ->map(function($c) {
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'grade_id' => $c->grade_id,
                    'grade_name' => $c->grade?->name,
                    'school_id' => $c->grade?->school_id,
                    'students_count' => $c->students_count,
                    'teachers' => $c->teachers->map(function($t) {
                        return [
                            'user_id' => $t->user_id,
                            'name' => $t->name,
                            'name_en' => $t->name_en,
                        ];
                    })

                ];
            });

        $grades = Grade::where('school_id', $schoolId)
            ->with(['teacher.user', 'classrooms.students'])
            ->withCount('classrooms')
            ->orderBy('name')
            ->get()
            ->map(function($g) {
                return [
                    'id' => $g->id,
                    'name' => $g->name,
                    'teacher_id' => $g->teacher?->user_id,
                    'teacher_name' => $g->teacher?->name,
                    'teacher_name_en' => $g->teacher?->name_en,
                    'classrooms_count' => $g->classrooms_count,
                    'students_count' => $g->classrooms->sum(function($c) {
                        return $c->students->count();
                    }),
                ];
            });

        // Fetch teachers to populate the dropdown
        $availableTeachers = User::atSchool($schoolId)
            ->withRole('teacher')
            ->orderBy('first_name_ar')
            ->get()
            ->map(function($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'name_en' => $u->name_en,

                    'email' => $u->email,
                ];
            });

        return Inertia::render('School/Classrooms/Index', [
            'classrooms' => $classrooms,
            'grades' => $grades,
            'teachers' => $availableTeachers,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    // عرض صفحة تعديل الفصل وربط المعلمين
    public function edit(Classroom $classroom)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($classroom->grade?->school_id !== $user->getSchoolId()) {
            abort(403);
        }

        $teachers = User::atSchool($user->getSchoolId())
            ->withRole('teacher')
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

    // تحديث بيانات الفصل
    public function update(Request $request, Classroom $classroom)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($classroom->grade?->school_id !== $user->getSchoolId()) {
            abort(403);
        }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
        ]);

        $classroom->update($validated);

        return redirect()->back()->with('success', 'Class updated successfully');
    }

    // حفظ فصل جديد
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();
        Classroom::create([
            'name' => $validated['name'],
            'grade_id' => $validated['grade_id'],
        ]);

        return redirect()->back()->with('success', 'Class created successfully');
    }

    // --- Grade CRUD ---

    public function storeGrade(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'teacher_id' => 'nullable|exists:users,id',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();
        $schoolId = $user->getSchoolId();

        $grade = Grade::create([
            'name' => $validated['name'],
            'school_id' => $schoolId,
        ]);

        if (!empty($validated['teacher_id'])) {
            // Because it's 1:1, we must ensure the teacher is not assigned to another grade
            // and the grade doesn't have another teacher (handled by Grade creation here)
            \App\Models\Teacher::updateOrCreate(
                ['user_id' => $validated['teacher_id']],
                ['grade_id' => $grade->id, 'school_id' => $schoolId]
            );
        }

        return redirect()->back()->with('success', 'Grade created successfully');
    }

    public function updateGrade(Request $request, Grade $grade)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $schoolId = $user->getSchoolId();

        if ($grade->school_id !== $schoolId) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'teacher_id' => 'nullable|exists:users,id',
        ]);

        $grade->update(['name' => $validated['name']]);

        // Reset existing teacher for this grade
        \App\Models\Teacher::where('grade_id', $grade->id)->update(['grade_id' => null]);

        if (!empty($validated['teacher_id'])) {
            \App\Models\Teacher::updateOrCreate(
                ['user_id' => $validated['teacher_id']],
                ['grade_id' => $grade->id, 'school_id' => $schoolId]
            );
        }

        return redirect()->back()->with('success', 'Grade updated successfully');
    }

    public function destroyGrade(Grade $grade)
    {
        if ($grade->school_id !== Auth::user()->getSchoolId()) {
            abort(403);
        }

        $grade->delete();

        return redirect()->back()->with('success', 'Grade deleted successfully');
    }

    // حذف فصل
    public function destroy(Classroom $classroom)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($classroom->grade?->school_id !== $user->getSchoolId()) {
            abort(403);
        }

        $classroom->delete();

        return redirect()->back()->with('success', 'تم حذف الفصل بنجاح');
    }
}



