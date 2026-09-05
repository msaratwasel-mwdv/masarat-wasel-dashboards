<?php

namespace App\Http\Controllers\School;

// 1. استيراد كل الأدوات التي نحتاجها
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Student;
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
                'guardians:id,first_name_ar,last_name_ar,first_name_en,last_name_en,phone,national_id,address,image,email',
                'currentEnrollment.classroom:id,name',
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
            ->whereHas('enrollments', function ($q) {
                $q->where('is_active', true);
            });

        $counts = [
            'all' => (clone $baseQuery)->count(),
            'active' => (clone $baseQuery)->where('is_active', true)->count(),
            'inactive' => (clone $baseQuery)->where('is_active', false)->count(),
            'male' => (clone $baseQuery)->where('gender', 'male')->count(),
            'female' => (clone $baseQuery)->where('gender', 'female')->count(),
            'with_bus' => (clone $baseQuery)->where(function ($q) {
                $q->whereNotNull('forth_bus_id')->orWhereNotNull('back_bus_id');
            })->count(),
            'no_bus' => (clone $baseQuery)->whereNull('forth_bus_id')->whereNull('back_bus_id')->count(),
        ];

        // ⬅️ أضف where لفلترة حسب المدرسة
        $query = Student::inSchool($schoolId)
            ->whereHas('enrollments', function ($q) {
                $q->where('is_active', true);
            })
            ->with([
                'guardians:id,first_name_ar,last_name_ar,first_name_en,last_name_en,phone,national_id,address,image,email',
                'currentEnrollment.classroom:id,name',
                'forthBus.route', 'backBus.route',
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

        $allStudents = (clone $query)->orderBy('created_at', 'desc')->get();

        $students = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        $buses = \App\Models\Bus::where('school_id', $schoolId)->orderBy('bus_number')->get(['id', 'bus_number', 'plate_number']);

        $guardiansList = User::whereHas('roles', fn ($q) => $q->whereIn('name', ['parent', 'guardian']))
            ->where(function ($query) use ($schoolId) {
                $query->whereHas('students.enrollments.classroom', function ($q) use ($schoolId) {
                    $q->atSchool($schoolId);
                })
                    ->orWhereDoesntHave('students');
            })
            ->orderBy('first_name_ar')
            ->get(['id', 'first_name_ar', 'last_name_ar', 'first_name_en', 'last_name_en', 'national_id', 'phone', 'email', 'address']);

        return Inertia::render('School/Students/IndexStudents', [
            'students' => $students,
            'all_students' => $allStudents,
            'counts' => $counts,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $statusFilter,
            ],
            'classrooms' => Classroom::atSchool($schoolId)->orderBy('name')->get(['id', 'name']),
            'buses' => $buses,
            'guardians' => $guardiansList,
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
        $guardian = User::whereHas('roles', fn ($q) => $q->whereIn('name', ['parent', 'guardian']))
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
            'national_id' => 'required|string|max:50',
            'phone' => 'required|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'home_number' => 'nullable|string|max:50',
            'preferred_language' => 'nullable|in:ar,en',
            'image' => 'nullable|image|max:5120',
        ]);

        // Clean phone number from spaces/formatting
        $cleanPhone = preg_replace('/\s+/', '', $validated['phone']);
        $validated['phone'] = $cleanPhone;

        // Ensure at least one name (Arabic or English) is present
        if (empty($validated['name']) && empty($validated['name_en'])) {
            return back()->withErrors(['name' => 'يجب إدخال اسم ولي الأمر (عربي أو إنجليزي على الأقل).']);
        }

        // Bidirectional fallback: if one is empty, copy from the other
        if (empty($validated['name'])) {
            $validated['name'] = $validated['name_en'];
        }
        if (empty($validated['name_en'])) {
            $validated['name_en'] = $validated['name'];
        }

        $guardian = DB::transaction(function () use ($validated, $request) {
            $guardian = User::where('national_id', $validated['national_id'])
                ->orWhere('phone', $validated['phone'])
                ->first();

            $nameParts = User::parseFullName($validated['name'] ?? '');
            $enNameParts = User::parseFullName($validated['name_en'] ?? '');

            $firstAr = $nameParts[0] ?: ($enNameParts[0] ?? '');
            $lastAr = $nameParts[3] ?: ($enNameParts[3] ?? '');
            $firstEn = $enNameParts[0] ?: ($nameParts[0] ?? '');
            $lastEn = $enNameParts[3] ?: ($nameParts[3] ?? '');

            $guardianData = [
                'first_name_ar' => $firstAr,
                'last_name_ar' => $lastAr,
                'first_name_en' => $firstEn,
                'last_name_en' => $lastEn,
                'national_id' => $validated['national_id'],
                'phone' => $validated['phone'],
                'email' => $validated['email'] ?? null,
            ];

            if ($request->hasFile('image')) {
                $guardianData['image'] = $request->file('image')->store('guardians', 'public');
            }

            if ($guardian) {
                // تحديث بيانات ولي الأمر الحالي دون المساس بكلمة المرور
                $guardian->update($guardianData);
            } else {
                $guardianData['password'] = Hash::make($validated['phone']);
                $guardian = User::create($guardianData);
            }

            // التأكد من منح صلاحية parent وإضافة سجل Guardian
            $role = \App\Models\Role::firstOrCreate(['name' => 'parent']);
            if (! $guardian->roles->contains($role->id)) {
                $guardian->roles()->attach($role->id);
            }

            if (! $guardian->guardian) {
                \App\Models\Guardian::create(['user_id' => $guardian->id]);
            }

            return $guardian;
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

        // Validation rules: Arabic name is optional if English name is provided, and vice versa
        $validated = $request->validate([
            'first_name_ar' => 'nullable|string|max:255',
            'last_name_ar' => 'nullable|string|max:255',
            'first_name_en' => 'nullable|string|max:255',
            'last_name_en' => 'nullable|string|max:255',
            'student_code' => 'nullable|string|max:50|unique:students,student_code',
            'national_id' => 'required|string|max:50|unique:students,national_id',
            'gender' => 'required|in:male,female',
            'classroom_id' => [
                'required',
                Rule::exists('classrooms', 'id')->where(function ($q) use ($schoolId) {
                    $q->whereIn('grade_id', function ($sub) use ($schoolId) {
                        $sub->select('id')->from('grades')->where('school_id', $schoolId);
                    });
                }),
            ],
            'forth_bus_id' => ['nullable', 'integer', Rule::exists('buses', 'id')->where('school_id', $schoolId)],
            'back_bus_id' => ['nullable', 'integer', Rule::exists('buses', 'id')->where('school_id', $schoolId)],
            'image' => 'nullable|image|max:5120',
            'guardians' => 'required|array|min:1',
            'guardians.*.guardian_id' => 'required|integer|exists:users,id',
            'guardians.*.relationship_type' => 'nullable|string|max:255',
        ]);

        $hasAr = ! empty($validated['first_name_ar']) && ! empty($validated['last_name_ar']);
        $hasEn = ! empty($validated['first_name_en']) && ! empty($validated['last_name_en']);

        if (! $hasAr && ! $hasEn) {
            return back()->withErrors([
                'first_name_ar' => 'يجب إدخال الاسم الأول واسم العائلة للطالب (بالعربية أو بالإنجليزية على الأقل).',
            ])->withInput();
        }

        $firstNameAr = ! empty($validated['first_name_ar']) ? $validated['first_name_ar'] : ($validated['first_name_en'] ?? '');
        $lastNameAr = ! empty($validated['last_name_ar']) ? $validated['last_name_ar'] : ($validated['last_name_en'] ?? '');
        $firstNameEn = ! empty($validated['first_name_en']) ? $validated['first_name_en'] : ($validated['first_name_ar'] ?? '');
        $lastNameEn = ! empty($validated['last_name_en']) ? $validated['last_name_en'] : ($validated['last_name_ar'] ?? '');

        $school = Auth::user()->school;

        // استخدام Transaction لضمان سلامة البيانات
        DB::transaction(function () use ($validated, $schoolId, $request, $school, $firstNameAr, $lastNameAr, $firstNameEn, $lastNameEn) {
            // ⬅️ تحديث بيانات إنشاء الطالب
            $studentData = [
                'first_name_ar' => $firstNameAr,
                'last_name_ar' => $lastNameAr,
                'first_name_en' => $firstNameEn,
                'last_name_en' => $lastNameEn,
                'student_code' => $validated['student_code'] ?? 'ST-'.$validated['national_id'],
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

            // Attach guardians with pivot data
            foreach ($validated['guardians'] as $g) {
                $student->guardians()->attach($g['guardian_id'], [
                    'relationship_type' => $g['relationship_type'],
                ]);
            }

            $student->enrollments()->create([
                'classroom_id' => $validated['classroom_id'],
                'is_active' => true,
            ]);

            // Recalculate billing based on new student count
            try {
                app(\App\Services\SubscriptionService::class)->recalculatePendingInstallments($schoolId);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to recalculate installments on student creation: '.$e->getMessage());
            }

            // Notify Company Admins about new student
            try {
                app(\App\Services\NotificationService::class)->notifyCompanyAdmins(
                    'student_added',
                    '👤 تسجيل طالب جديد',
                    "تم تسجيل الطالب ({$student->first_name_ar} {$student->last_name_ar}) في مدرسة: {$school->name}",
                    ['school_id' => $schoolId, 'student_id' => $student->id]
                );
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to notify admins on student creation: '.$e->getMessage());
            }
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
            'first_name_ar' => 'nullable|string|max:255',
            'last_name_ar' => 'nullable|string|max:255',
            'first_name_en' => 'nullable|string|max:255',
            'last_name_en' => 'nullable|string|max:255',
            'national_id' => ['nullable', 'string', 'max:50', Rule::unique('students')->ignore($student->id)],
            'gender' => 'required|in:male,female',
            'classroom_id' => [
                'required',
                Rule::exists('classrooms', 'id')->where(function ($q) use ($schoolId) {
                    $q->whereIn('grade_id', function ($sub) use ($schoolId) {
                        $sub->select('id')->from('grades')->where('school_id', $schoolId);
                    });
                }),
            ],
            'forth_bus_id' => ['nullable', 'integer', Rule::exists('buses', 'id')->where('school_id', $schoolId)],
            'back_bus_id' => ['nullable', 'integer', Rule::exists('buses', 'id')->where('school_id', $schoolId)],
            'is_active' => 'required|boolean',
            'image' => 'nullable|image|max:5120',

            // Multi-Guardian Data
            'guardians' => 'required|array|min:1',
            'guardians.*.guardian_id' => 'required|integer|exists:users,id',
            'guardians.*.relationship_type' => 'nullable|string|max:255',
            'guardians.*.name' => 'nullable|string|max:255',
            'guardians.*.name_en' => 'nullable|string|max:255',
            'guardians.*.phone' => 'required|string|max:50',
            'guardians.*.address' => 'nullable|string|max:255',
            'guardians.*.home_number' => 'nullable|string|max:50',
        ]);

        $hasAr = ! empty($validated['first_name_ar']) && ! empty($validated['last_name_ar']);
        $hasEn = ! empty($validated['first_name_en']) && ! empty($validated['last_name_en']);

        if (! $hasAr && ! $hasEn) {
            return back()->withErrors([
                'first_name_ar' => 'يجب إدخال الاسم الأول واسم العائلة للطالب (بالعربية أو بالإنجليزية على الأقل).',
            ])->withInput();
        }

        $firstNameAr = ! empty($validated['first_name_ar']) ? $validated['first_name_ar'] : ($validated['first_name_en'] ?? '');
        $lastNameAr = ! empty($validated['last_name_ar']) ? $validated['last_name_ar'] : ($validated['last_name_en'] ?? '');
        $firstNameEn = ! empty($validated['first_name_en']) ? $validated['first_name_en'] : ($validated['first_name_ar'] ?? '');
        $lastNameEn = ! empty($validated['last_name_en']) ? $validated['last_name_en'] : ($validated['last_name_ar'] ?? '');

        DB::transaction(function () use ($validated, $request, $student, $firstNameAr, $lastNameAr, $firstNameEn, $lastNameEn) {
            $studentData = [
                'first_name_ar' => $firstNameAr,
                'last_name_ar' => $lastNameAr,
                'first_name_en' => $firstNameEn,
                'last_name_en' => $lastNameEn,
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

            // Sync Guardians
            $syncData = [];
            foreach ($validated['guardians'] as $g) {
                $syncData[$g['guardian_id']] = [
                    'relationship_type' => $g['relationship_type'],
                ];

                // Also update the guardian's user record
                $guardianUser = \App\Models\User::find($g['guardian_id']);
                if ($guardianUser) {
                    $gNameAr = ! empty($g['name']) ? $g['name'] : ($g['name_en'] ?? '');
                    $gNameEn = ! empty($g['name_en']) ? $g['name_en'] : ($g['name'] ?? '');

                    $arParts = \App\Models\User::parseFullName($gNameAr);
                    $enParts = \App\Models\User::parseFullName($gNameEn);

                    $guardianUser->update([
                        'first_name_ar' => $arParts[0] ?: ($enParts[0] ?? ''),
                        'last_name_ar' => $arParts[3] ?: ($enParts[3] ?? ''),
                        'first_name_en' => $enParts[0] ?: ($arParts[0] ?? ''),
                        'last_name_en' => $enParts[3] ?: ($arParts[3] ?? ''),
                        'phone' => $g['phone'],
                        'address' => $g['address'],
                        'home_number' => $g['home_number'],
                    ]);
                }
            }
            $student->guardians()->sync($syncData);
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

            // Recalculate billing based on new student count
            try {
                if ($studentSchoolId) {
                    app(\App\Services\SubscriptionService::class)->recalculatePendingInstallments($studentSchoolId);

                    $school = \App\Models\School::find($studentSchoolId);
                    if ($school) {
                        app(\App\Services\NotificationService::class)->notifyCompanyAdmins(
                            'student_deleted',
                            '👤 حذف طالب',
                            "تم حذف طالب من مدرسة: {$school->name}",
                            ['school_id' => $studentSchoolId, 'student_id' => $student->id]
                        );
                    }
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to recalculate installments or notify on student deletion: '.$e->getMessage());
            }
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

    /**
     * [Export] تصدير بيانات الطلاب وأولياء الأمور
     */
    public function export()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\StudentsExport(false), 'students.xlsx');
    }

    /**
     * [Export] تحميل قالب الاستيراد
     */
    public function downloadTemplate()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\StudentsExport(true), 'students_template.xlsx');
    }

    /**
     * [Import] استيراد الطلاب وأولياء الأمور
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
        ]);

        $import = new \App\Imports\StudentsImport;
        \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));

        if (! empty($import->errors()) || ! empty($import->failures())) {
            return redirect()->back()->with('error', "تم استيراد {$import->successCount} بنجاح، وحدثت أخطاء في بعض الصفوف.");
        }

        return redirect()->back()->with('success', "تم استيراد {$import->successCount} طالب بنجاح وتحديث القائمة.");
    }
}
