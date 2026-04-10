<?php

namespace App\Http\Controllers\School;

// 1. استيراد كل الأدوات التي نحتاجها
use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StudentController extends Controller
{
    /**
     * [Read] عرض قائمة الطلاب
     */
    /**
     * [API] Fetch all students for dropdowns and search
     */
    public function apiIndex()
    {
        $schoolId = Auth::user()->getSchoolId();

        $students = Student::where('school_id', $schoolId)
            ->with([
                'guardian:id,name,name_en,phone,national_id,address,home_number',
                'currentEnrollment.classroom:id,name'
            ])
            ->get(['id', 'first_name_ar', 'last_name_ar', 'student_code', 'national_id', 'guardian_id']);
        // Note: classroom_id is not in students table, it's in enrollments.

        // Map data to include classroom_id at root level for frontend convenience
        $students->transform(function ($student) {
            $student->classroom_id = $student->currentEnrollment?->classroom_id;
            return $student;
        });

        return response()->json($students);
    }

    /**
     * [Read] عرض قائمة الطلاب
     */
    public function index(Request $request)
    {
        $schoolId = Auth::user()->getSchoolId();
        $search = $request->input('search');

        // ⬅️ أضف where لفلترة حسب المدرسة
        $students = Student::where('school_id', $schoolId) // ⬅️ أضف هذا السطر
            ->with([
                'guardian:id,name,name_en,phone,national_id,address,home_number,image',
                'supervisor:id,name,email',
                'currentEnrollment.classroom:id,name',
                'forthBus.route', 'backBus.route'
            ])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name_ar', 'like', "%{$search}%")
                      ->orWhere('last_name_ar', 'like', "%{$search}%")
                        ->orWhere('student_code', 'like', "%{$search}%")
                        ->orWhere('national_id', 'like', "%{$search}%")
                        ->orWhereHas('guardian', function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%")
                                ->orWhere('national_id', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%"); // ⬅️ أضف هذا
                        });
                });
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('School/Students/IndexStudents', [
            'students' => $students,
            'filters' => $request->only(['search']),
            'classrooms' => Classroom::where('school_id', $schoolId)->orderBy('name')->get(['id', 'name']),
            'routes' => \App\Models\Route::where('school_id', $schoolId)->orderBy('name')->get(['id', 'name']),
            'supervisors' => User::whereHas('roles', fn($q) => $q->whereIn('name', ['supervisor', 'teacher', 'school_admin']))
                ->whereHas('schoolAdmin', fn($q) => $q->where('school_id', $schoolId))
                ->orWhereHas('fieldSupervisor', fn($q) => $q->where('school_id', $schoolId))
                ->orWhereHas('teacher')
                ->orderBy('first_name_ar')
                ->get(['id', 'first_name_ar', 'last_name_ar', 'email']),            'guardianResult' => session('guardianResult'),
        ]);
    }
    /**
     * [Create] عرض صفحة إنشاء طالب جديد
     */
    public function create()
    {
        $schoolId = Auth::user()->getSchoolId();

        // جلب الفصول المتاحة في مدرسة المدير لوضعها في قائمة منسدلة
        $classrooms = Classroom::where('school_id', $schoolId)->orderBy('name')->get(['id', 'name']);

        // جلب المشرفين المتاحين في نفس المدرسة
        $supervisors = User::whereHas('roles', fn($q) => $q->whereIn('name', ['supervisor', 'teacher', 'school_admin']))
            ->where(fn($q) => $q
                ->whereHas('schoolAdmin', fn($q2) => $q2->where('school_id', $schoolId))
                ->orWhereHas('fieldSupervisor', fn($q2) => $q2->where('school_id', $schoolId))
                ->orWhereHas('teacher')
            )
            ->orderBy('first_name_ar')
            ->get(['id', 'first_name_ar', 'last_name_ar', 'email']);

        $busGroups = \App\Models\BusGroup::with('bus')->where('school_id', $schoolId)->orderBy('name')->get();

        return Inertia::render('School/Students/CreateStudent', [
            'classrooms' => $classrooms,
            'routes' => \App\Models\Route::where('school_id', $schoolId)->orderBy('name')->get(['id', 'name']),
            'supervisors' => $supervisors,            'guardianResult' => session('guardianResult'),
        ]);
    }

    /**
     * Step 1: Search guardian by national_id
     */
    public function searchGuardian(Request $request)
    {
        $validated = $request->validate([
            'national_id' => 'required|string|max:50',
        ]);

        // Support both 'parent' and 'guardian' roles in case legacy records exist
        $guardian = User::whereHas('roles', fn($q) => $q->whereIn('name', ['parent', 'guardian']))
            ->where('national_id', $validated['national_id'])
            ->first();

        return redirect()->back()->with([
            'guardianResult' => $guardian ? [
                'found' => true,
                'guardian' => $guardian,
            ] : [
                'found' => false,
                'guardian' => null,
            ],
        ]);
    }

    /**
     * Step 1 (alternative): Create a new guardian
     */
    public function storeGuardian(Request $request)
    {
        $schoolId = Auth::user()->getSchoolId();

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'national_id' => 'required|string|max:50|unique:users,national_id',
            'phone' => 'required|string|max:50|unique:users,phone',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'home_number' => 'nullable|string|max:50',
            'preferred_language' => 'nullable|in:ar,en',
            'image' => 'nullable|image|max:5120',
        ]);

        // Clean phone number from spaces/formatting
        $cleanPhone = preg_replace('/\s+/', '', $validated['phone']);
        $validated['phone'] = $cleanPhone;

        // Ensure at least one name is present
        if (empty($validated['name']) && empty($validated['name_en'])) {
            return back()->withErrors(['name' => 'يجب إدخال اسم ولي الأمر (عربي أو إنجليزي).']);
        }

        // Fall back: if Arabic name is empty, copy from English name
        if (empty($validated['name'])) {
            $validated['name'] = $validated['name_en'];
        }

        DB::transaction(function () use ($validated, $schoolId, $request) {
            $guardianData = [
                'first_name_ar'  => $validated['name'] ?? '',
                'second_name_ar' => '',
                'third_name_ar'  => '',
                'last_name_ar'   => '',
                'first_name_en'  => $validated['name_en'] ?? '',
                'second_name_en' => '',
                'third_name_en'  => '',
                'last_name_en'   => '',
                'national_id'    => $validated['national_id'],
                'phone'          => $validated['phone'],
                'email'          => $validated['email'] ?? null,
                'password'       => Hash::make($validated['phone']),
                'is_active'      => true,
            ];

            if ($request->hasFile('image')) {
                $guardianData['image'] = $request->file('image')->store('guardians', 'public');
            }

            $guardian = User::create($guardianData);

            // Attach guardian/parent role via pivot
            $role = \App\Models\Role::firstOrCreate(['name' => 'parent']);
            $guardian->roles()->attach($role->id);

            // Create Guardian extension record
            \App\Models\Guardian::create(['user_id' => $guardian->id]);
        });

        return redirect()->back()->with([
            'guardianResult' => [
                'found' => true,
                'guardian' => $guardian,
            ],
        ]);
    }
    /**
     * [Create] تخزين الطالب الجديد
     */
    /**
     * [Create] تخزين الطالب الجديد
     */
    public function store(Request $request)
    {
        $schoolId = Auth::user()->getSchoolId();

        // ⬅️ تحديث validation rules لإضافة الحقول الجديدة
        $validated = $request->validate([
            'first_name_ar' => 'required|string|max:255',
            'second_name_ar' => 'required|string|max:255',
            'third_name_ar' => 'required|string|max:255',
            'last_name_ar' => 'required|string|max:255',
            'first_name_en' => 'required|string|max:255',
            'second_name_en' => 'required|string|max:255',
            'third_name_en' => 'required|string|max:255',
            'last_name_en' => 'required|string|max:255',
            'student_code' => 'nullable|string|max:50|unique:students,student_code',
            'national_id' => 'required|string|max:50|unique:students,national_id',
            'gender' => 'required|in:male,female',
            'classroom_id' => ['required', Rule::exists('classrooms', 'id')->where('school_id', $schoolId)],
            'guardian_id' => 'required|integer|exists:users,id',
            'supervisor_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where('school_id', $schoolId)],
            'forth_route_id' => ['nullable', 'integer', Rule::exists('routes', 'id')->where('school_id', $schoolId)],
            'back_route_id' => ['nullable', 'integer', Rule::exists('routes', 'id')->where('school_id', $schoolId)],
            'morning_group_id' => ['nullable', 'integer', Rule::exists('bus_groups', 'id')->where('school_id', $schoolId)],
            'afternoon_group_id' => ['nullable', 'integer', Rule::exists('bus_groups', 'id')->where('school_id', $schoolId)],
            'image' => 'nullable|image|max:5120',
        ]);

        // استخدام Transaction لضمان سلامة البيانات
        DB::transaction(function () use ($validated, $schoolId, $request) {
            // ⬅️ تحديث بيانات إنشاء الطالب
            $studentData = [
                'first_name_ar' => $validated['first_name_ar'],
                'second_name_ar' => $validated['second_name_ar'],
                'third_name_ar' => $validated['third_name_ar'],
                'last_name_ar' => $validated['last_name_ar'],
                'first_name_en' => $validated['first_name_en'],
                'second_name_en' => $validated['second_name_en'],
                'third_name_en' => $validated['third_name_en'],
                'last_name_en' => $validated['last_name_en'],
                'student_code' => $validated['student_code'] ?? 'ST-' . $validated['national_id'],
                'national_id' => $validated['national_id'],
                'gender' => $validated['gender'],
                'guardian_id' => $validated['guardian_id'],
                'supervisor_id' => $validated['supervisor_id'] ?? null,
                'forth_route_id' => $validated['forth_route_id'] ?? null,
                'back_route_id' => $validated['back_route_id'] ?? null,
                'morning_group_id' => $validated['morning_group_id'] ?? null,
                'afternoon_group_id' => $validated['afternoon_group_id'] ?? null,
                'school_id' => $schoolId,
            ];

            // ⬅️ معالجة صورة الطالب
            if ($request->hasFile('image')) {
                $studentData['image'] = $request->file('image')->store('students', 'public');
            }

            $student = Student::create($studentData);

            $student->enrollments()->create([
                'school_id' => $schoolId,
                'classroom_id' => $validated['classroom_id'],
                'status' => 'active',
                'is_active' => true,
            ]);
        });

        return redirect()->route('school.students.index')->with('success', 'Student created successfully.');
    }

    /**
     * View attendance history for a student
     */
    public function attendanceHistory(Student $student)
    {
        // نفس منطق الحماية المستخدم في التعديل/الحذف
        $this->authorize('update', $student);

        $schoolId = Auth::user()->getSchoolId();



        return Inertia::render('School/Students/AttendanceHistory', [
            'student' => $student->only(['id', 'first_name_ar', 'last_name_ar', 'student_code']),
        ]);
    }

    /**
     * [Update] عرض صفحة تعديل الطالب
     */
    public function edit(Student $student)
    {
        // التحقق من أن المدير يملك صلاحية تعديل هذا الطالب
        $this->authorize('update', $student);

        return Inertia::render('School/Students/EditStudent', [
            'student' => $student->load(['currentEnrollment', 'guardian', 'supervisor:id,name', 'forthBus.route', 'backBus.route']),
            'classrooms' => Classroom::where('school_id', Auth::user()->getSchoolId())->orderBy('name')->get(['id', 'name']),
            'routes' => \App\Models\Route::where('school_id', Auth::user()->getSchoolId())->orderBy('name')->get(['id', 'name']),
            'supervisors' => User::whereHas('roles', fn($q) => $q->whereIn('name', ['supervisor', 'teacher', 'school_admin']))
                ->where(fn($q) => $q
                    ->whereHas('schoolAdmin', fn($q2) => $q2->where('school_id', Auth::user()->getSchoolId()))
                    ->orWhereHas('fieldSupervisor', fn($q2) => $q2->where('school_id', Auth::user()->getSchoolId()))
                    ->orWhereHas('teacher')
                )
                ->orderBy('first_name_ar')
                ->get(['id', 'first_name_ar', 'last_name_ar', 'email']),        ]);
    }

    /**
     * [Update] تحديث بيانات الطالب
     */
    public function update(Request $request, Student $student)
    {

        $this->authorize('update', $student);
        $schoolId = Auth::user()->getSchoolId();;
        // 🛠️ إصلاح مشكلة القيم الفارغة (fix empty strings failing validation)


        try {
            $validated = $request->validate([
                // Student Data
                'first_name_ar' => 'required|string|max:255',
                'second_name_ar' => 'required|string|max:255',
                'third_name_ar' => 'required|string|max:255',
                'last_name_ar' => 'required|string|max:255',
                'first_name_en' => 'required|string|max:255',
                'second_name_en' => 'required|string|max:255',
                'third_name_en' => 'required|string|max:255',
                'last_name_en' => 'required|string|max:255',
                'national_id' => ['nullable', 'string', 'max:50', Rule::unique('students')->ignore($student->id)],
                'gender' => 'required|in:male,female',
                'classroom_id' => ['required', Rule::exists('classrooms', 'id')->where('school_id', $schoolId)],
                'forth_route_id' => ['nullable', 'integer', Rule::exists('routes', 'id')->where('school_id', $schoolId)],
                'back_route_id' => ['nullable', 'integer', Rule::exists('routes', 'id')->where('school_id', $schoolId)],
                'morning_group_id' => ['nullable', 'integer', Rule::exists('bus_groups', 'id')->where('school_id', $schoolId)],
                'afternoon_group_id' => ['nullable', 'integer', Rule::exists('bus_groups', 'id')->where('school_id', $schoolId)],
                'is_active' => 'required|boolean',
                'image' => 'nullable|image|max:5120',

                // Guardian Data (now referencing users table)
                'guardian.name' => 'required|string|max:255',
                'guardian.name_en' => 'nullable|string|max:255',
                'guardian.national_id' => ['required', 'string', 'max:50', Rule::unique('users', 'national_id')->ignore($student->guardian_id)],
                'guardian.phone' => ['required', 'string', 'max:50', Rule::unique('users', 'phone')->ignore($student->guardian_id)],
                'guardian.address' => 'nullable|string|max:255',
                'guardian.home_number' => 'nullable|string|max:50',
                'guardian.image' => 'nullable|image|max:5120',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // 🛑 إظهار أخطاء التحقق لمعرفة المشكلة بالضبط
            dd($e->errors());
        }

        DB::transaction(function () use ($validated, $request, $student) {
            // Update Student
            $studentData = [
                'first_name_ar' => $validated['first_name_ar'],
                'second_name_ar' => $validated['second_name_ar'],
                'third_name_ar' => $validated['third_name_ar'],
                'last_name_ar' => $validated['last_name_ar'],
                'first_name_en' => $validated['first_name_en'],
                'second_name_en' => $validated['second_name_en'],
                'third_name_en' => $validated['third_name_en'],
                'last_name_en' => $validated['last_name_en'],
                'national_id' => $validated['national_id'],
                'gender' => $validated['gender'],
                'forth_route_id' => $validated['forth_route_id'] ?? null,
                'back_route_id' => $validated['back_route_id'] ?? null,
                'morning_group_id' => $validated['morning_group_id'] ?? null,
                'afternoon_group_id' => $validated['afternoon_group_id'] ?? null,
                'is_active' => $validated['is_active'],
            ];

            if ($request->hasFile('image')) {
                $studentData['image'] = $request->file('image')->store('students', 'public');
            }

            $student->update($studentData);

            // Update Class Enrollment
            if ($student->currentEnrollment) {
                $student->currentEnrollment->update([
                    'classroom_id' => $validated['classroom_id'],
                ]);
            }

            // Update Guardian (now a User record)
            $guardianData = [
                'name' => $validated['guardian']['name'],
                'name_en' => $validated['guardian']['name_en'],
                'national_id' => $validated['guardian']['national_id'],
                'phone' => $validated['guardian']['phone'],
                'address' => $validated['guardian']['address'],
                'home_number' => $validated['guardian']['home_number'],
            ];

            if ($request->hasFile('guardian.image')) {
                $guardianData['image'] = $request->file('guardian.image')->store('guardians', 'public');
            }

            $student->guardian->update($guardianData);
        });

        return redirect()->route('school.students.index')->with('success', 'Student updated successfully.');
    }

    /**
     * [Delete] حذف الطالب
     */
    public function destroy(Student $student)
    {
        $this->authorize('delete', $student);

        $student->delete();

        return redirect()->route('school.students.index')->with('success', 'Student deleted successfully.');
    }
}



