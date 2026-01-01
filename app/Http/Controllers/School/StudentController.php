<?php

namespace App\Http\Controllers\School;

// 1. استيراد كل الأدوات التي نحتاجها
use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StudentController extends Controller
{
    /**
     * [Read] عرض قائمة الطلاب
     */
    public function index()
    {
        $schoolId = Auth::user()->school_id;

        // جلب الطلاب الذين لديهم سجل التحاق فعال في مدرسة المدير الحالي
        $students = Student::all();
           // عرض الطلاب الجدد أولاً
 // الحفاظ على الفلاتر عند التنقل بين الصفحات

        return Inertia::render('School/Students/IndexStudents', [
            'students' => $students,
        ]);
    }

    /**
     * [Create] عرض صفحة إنشاء طالب جديد
     */
    public function create()
    {
        // جلب الفصول المتاحة في مدرسة المدير لوضعها في قائمة منسدلة
        $classrooms = Classroom::where('school_id', Auth::user()->school_id)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('School/Students/CreateStudent', [
            'classrooms' => $classrooms,
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

        $guardian = Guardian::where('national_id', $validated['national_id'])->first();

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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'national_id' => 'required|string|max:50|unique:guardians,national_id',
            'phone' => 'required|string|max:50|unique:guardians,phone',
            'email' => 'nullable|email|max:255',
        ]);

        $guardian = Guardian::create($validated);

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
    public function store(Request $request)
    {
        $schoolId = Auth::user()->school_id;

        // التحقق من صحة البيانات المدخلة
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'student_code' => 'required|string|max:50|unique:students,student_code',
            'classroom_id' => ['required', Rule::exists('classrooms', 'id')->where('school_id', $schoolId)],
            'guardian_id' => 'required|integer|exists:guardians,id',
            // يمكنك إضافة المزيد من حقول التحقق هنا
        ]);

        // استخدام Transaction لضمان سلامة البيانات
        DB::transaction(function () use ($validated, $schoolId) {
            $student = Student::create([
                'full_name' => $validated['full_name'],
                'student_code' => $validated['student_code'],
                'guardian_id' => $validated['guardian_id'],
            ]);

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

        $schoolId = Auth::user()->school_id;



        return Inertia::render('School/Students/AttendanceHistory', [
            'student' => $student->only(['id', 'full_name', 'student_code']),
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
            'student' => $student->load('currentEnrollment'), // تحميل بيانات الالتحاق الحالية
            'classrooms' => Classroom::where('school_id', Auth::user()->school_id)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * [Update] تحديث بيانات الطالب
     */
    public function update(Request $request, Student $student)
    {
        $this->authorize('update', $student);
        $schoolId = Auth::user()->school_id;

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'student_code' => ['required', 'string', 'max:50', Rule::unique('students')->ignore($student->id)],
            'classroom_id' => ['required', Rule::exists('classrooms', 'id')->where('school_id', $schoolId)],
            'is_active' => 'required|boolean',
        ]);

        DB::transaction(function () use ($validated, $student) {
            $student->update([
                'full_name' => $validated['full_name'],
                'student_code' => $validated['student_code'],
                'is_active' => $validated['is_active'],
            ]);

            // تحديث الفصل في سجل الالتحاق الحالي
            if ($student->currentEnrollment) {
                $student->currentEnrollment->update([
                    'classroom_id' => $validated['classroom_id'],
                ]);
            }
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
