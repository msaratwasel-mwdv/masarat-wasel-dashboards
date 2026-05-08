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

        $students = Student::inSchool($schoolId)
            ->with([
                'guardians:id,first_name_ar,second_name_ar,third_name_ar,last_name_ar,first_name_en,second_name_en,third_name_en,last_name_en,phone,national_id,address,image',
                'currentEnrollment.classroom:id,name'
            ])
            ->get(['id', 'first_name_ar', 'last_name_ar', 'student_code', 'national_id']);
        // Note: classroom_id is not in students table, it's in enrollments.

        // Map data to include classroom_id at root level for frontend convenience
        $students->transform(function ($student) {
            $student->classroom_id = $student->currentEnrollment?->classroom_id;
            $student->name = $student->full_name_ar ?? current(array_filter([$student->first_name_ar, $student->last_name_ar])) ?? 'Unknown';
            $student->student_national_id = $student->national_id;
            
            $firstGuardian = $student->guardians->first();
            if ($firstGuardian) {
                // Ensure array shape matches UI `guardian?: { name: string, phone: string, national_id: string }`
                $student->guardian = [
                    'name' => $firstGuardian->name ?? $firstGuardian->first_name_ar,
                    'phone' => $firstGuardian->phone,
                    'national_id' => $firstGuardian->national_id,
                ];
            } else {
                $student->guardian = null;
            }

            // Remove large collection to keep API response minimal
            unset($student->guardians);

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
        $statusFilter = $request->input('status', 'all');

        // Base query for counts (before filtering)
        $baseQuery = Student::inSchool($schoolId)
            ->whereHas('enrollments', function($q) {
                $q->where('is_active', true);
            });

        $counts = [
            'all' => (clone $baseQuery)->count(),
            'active' => (clone $baseQuery)->where('is_active', true)->count(),
            'inactive' => (clone $baseQuery)->where('is_active', false)->count(),
        ];

        // ⬅️ أضف where لفلترة حسب المدرسة
        $query = Student::inSchool($schoolId)
            ->whereHas('enrollments', function($q) {
                $q->where('is_active', true);
            })
            ->with([
                'guardians:id,first_name_ar,second_name_ar,third_name_ar,last_name_ar,first_name_en,second_name_en,third_name_en,last_name_en,phone,national_id,address,image',
                'currentEnrollment.classroom:id,name',
                'forthBus.route', 'backBus.route'
            ])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name_ar', 'like', "%{$search}%")
                      ->orWhere('last_name_ar', 'like', "%{$search}%")
                        ->orWhere('student_code', 'like', "%{$search}%")
                        ->orWhere('national_id', 'like', "%{$search}%")
                        ->orWhereHas('guardians', function ($q) use ($search) {
                            $q->where('first_name_ar', 'like', "%{$search}%")
                                ->orWhere('national_id', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%"); // ⬅️ أضف هذا
                        });
                });
            });

        // Status filter
        if ($statusFilter === 'active') {
            $query->where('is_active', true);
        } elseif ($statusFilter === 'inactive') {
            $query->where('is_active', false);
        }

        $students = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        $buses = \App\Models\Bus::where('school_id', $schoolId)->orderBy('bus_number')->get(['id', 'bus_number', 'plate_number']);

        return Inertia::render('School/Students/IndexStudents', [
            'students' => $students,
            'counts' => $counts,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $statusFilter,
            ],
            'classrooms' => Classroom::where('school_id', $schoolId)->orderBy('name')->get(['id', 'name']),
            'buses' => $buses,
            'guardianResult' => session('guardianResult'),
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
        $supervisors = User::atSchool($schoolId)
            ->whereHas('roles', fn($q) => $q->whereIn('name', ['assistant', 'teacher', 'school_admin']))
            ->orderBy('first_name_ar')
            ->get(['id', 'first_name_ar', 'last_name_ar', 'email']);

        $buses = \App\Models\Bus::where('school_id', $schoolId)->orderBy('bus_number')->get(['id', 'bus_number', 'plate_number']);

        return Inertia::render('School/Students/CreateStudent', [
            'classrooms' => $classrooms,
            'buses' => $buses,
            'guardianResult' => session('guardianResult'),
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

        DB::transaction(function () use ($validated, $request) {
            $nameParts = User::parseFullName($validated['name'] ?? '');
            $enNameParts = User::parseFullName($validated['name_en'] ?? '');

            $guardianData = [
                'first_name_ar'  => $nameParts[0],
                'second_name_ar' => $nameParts[1],
                'third_name_ar'  => $nameParts[2],
                'last_name_ar'   => $nameParts[3],
                'first_name_en'  => $enNameParts[0],
                'second_name_en' => $enNameParts[1],
                'third_name_en'  => $enNameParts[2],
                'last_name_en'   => $enNameParts[3],
                'national_id'    => $validated['national_id'],
                'phone'          => $validated['phone'],
                'email'          => $validated['email'] ?? null,
                'password'       => Hash::make($validated['phone']),
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
            'forth_bus_id' => ['nullable', 'integer', Rule::exists('buses', 'id')->where('school_id', $schoolId)],
            'back_bus_id' => ['nullable', 'integer', Rule::exists('buses', 'id')->where('school_id', $schoolId)],
            'image' => 'nullable|image|max:5120',
        ]);

        $school = Auth::user()->school;
        $maxStudents = $school->plan?->max_students;

        if ($maxStudents !== null) {
            $currentStudentsCount = Student::inSchool($schoolId)->count();
            if ($currentStudentsCount >= $maxStudents) {
                return redirect()->back()->with('error', "عذراً، مدرستك استنفذت الحد الأقصى للطلاب المسموح به في باقتك ({$maxStudents} طالب).");
            }
        }

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
                'forth_bus_id' => $validated['forth_bus_id'] ?? null,
                'back_bus_id' => $validated['back_bus_id'] ?? null,
            ];

            // ⬅️ معالجة صورة الطالب
            if ($request->hasFile('image')) {
                $studentData['image'] = $request->file('image')->store('students', 'public');
            }

            $student = Student::create($studentData);

            $student->guardians()->attach($validated['guardian_id'], ['relationship_type' => 'Primary']);

            $student->enrollments()->create([
                'classroom_id' => $validated['classroom_id'],
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

        $schoolId = Auth::user()->getSchoolId();
        
        $buses = \App\Models\Bus::where('school_id', $schoolId)->orderBy('bus_number')->get(['id', 'bus_number', 'plate_number']);

        return Inertia::render('School/Students/EditStudent', [
            'student' => $student->load(['currentEnrollment', 'guardians', 'forthBus.route', 'backBus.route']),
            'classrooms' => Classroom::where('school_id', $schoolId)->orderBy('name')->get(['id', 'name']),
            'buses' => $buses,
        ]);
    }

    /**
     * [Update] تحديث بيانات الطالب
     */
    public function update(Request $request, Student $student)
    {
        $this->authorize('update', $student);
        $schoolId = Auth::user()->getSchoolId();

        $guardianId = $student->guardians()->first()?->id;

        // Laravel يعيد المستخدم تلقائياً مع رسائل الخطأ عند فشل الـ validation
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
            'forth_bus_id' => ['nullable', 'integer', Rule::exists('buses', 'id')->where('school_id', $schoolId)],
            'back_bus_id' => ['nullable', 'integer', Rule::exists('buses', 'id')->where('school_id', $schoolId)],
            'is_active' => 'required|boolean',
            'image' => 'nullable|image|max:5120',

            // Guardian Data (now referencing users table)
            'guardian.name' => 'required|string|max:255',
            'guardian.name_en' => 'nullable|string|max:255',
            'guardian.national_id' => ['required', 'string', 'max:50', Rule::unique('users', 'national_id')->ignore($guardianId)],
            'guardian.phone' => ['required', 'string', 'max:50', Rule::unique('users', 'phone')->ignore($guardianId)],
            'guardian.address' => 'nullable|string|max:255',
            'guardian.home_number' => 'nullable|string|max:50',
            'guardian.image' => 'nullable|image|max:5120',
        ]);

        DB::transaction(function () use ($validated, $request, $student) {
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
                'forth_bus_id' => $validated['forth_bus_id'] ?? null,
                'back_bus_id' => $validated['back_bus_id'] ?? null,
                'is_active' => $validated['is_active'],
            ];

            if ($request->hasFile('image')) {
                $studentData['image'] = $request->file('image')->store('students', 'public');
            }

            $student->update($studentData);

            if ($student->currentEnrollment) {
                $student->currentEnrollment->update([
                    'classroom_id' => $validated['classroom_id'],
                ]);
            } else {
                $student->enrollments()->create([
                    'classroom_id' => $validated['classroom_id'],
                    'is_active' => true,
                ]);
            }

            $guardianData = [
                'first_name_ar' => $validated['guardian']['name'],
                'first_name_en' => $validated['guardian']['name_en'],
                'national_id' => $validated['guardian']['national_id'],
                'phone' => $validated['guardian']['phone'],
                'address' => $validated['guardian']['address'],
                'home_number' => $validated['guardian']['home_number'],
            ];

            if ($request->hasFile('guardian.image')) {
                $guardianData['image'] = $request->file('guardian.image')->store('guardians', 'public');
            }

            $guardian = $student->guardians()->first();
            if ($guardian) {
                $guardian->update($guardianData);
            }
        });

        return redirect()->route('school.students.index')->with('success', 'Student updated successfully.');
    }

    /**
     * [Delete] حذف الطالب (Soft Delete مع تنظيف البيانات المرتبطة)
     */
    public function destroy(Student $student)
    {
        // التحقق أن الطالب ينتمي لمدرسة المدير الحالي
        $schoolId = Auth::user()->getSchoolId();
        $studentSchoolId = $student->currentEnrollment?->school_id;

        // السماح بالحذف إذا: نفس المدرسة أو طالب بدون تسجيل (يتيم)
        if ($studentSchoolId && (int) $schoolId !== (int) $studentSchoolId) {
            abort(403, 'لا يحق لك حذف طالب من مدرسة أخرى.');
        }

        DB::transaction(function () use ($student) {
            // Boot::deleting event يتكفل بـ:
            // 1. إلغاء تخصيص الباصات (forth_bus_id, back_bus_id → null)
            // 2. تعطيل التسجيل الأكاديمي (is_active → false)
            $student->delete(); // Soft Delete — يحتفظ بالسجل مع deleted_at
        });

        return redirect()->route('school.students.index')->with('success', 'Student deleted successfully.');
    }

    /**
     * [Print] طباعة بطاقة الطالب
     */
    public function printCard(Student $student)
    {
        $student->load(['guardians', 'currentEnrollment.classroom.school', 'forthBus.route', 'backBus.route']);

        $this->authorize('view', $student);

        return Inertia::render('School/Students/PrintCard', [
            'student' => $student,
        ]);
    }
}



