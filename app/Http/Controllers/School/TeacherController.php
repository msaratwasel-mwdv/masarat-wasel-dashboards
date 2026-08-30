<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
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
        $schoolId = $user->getSchoolId();
        $search = $request->input('search');

        $teachers = User::query()
            ->atSchool($schoolId)
            ->withRole('teacher')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name_ar', 'like', "%{$search}%")
                        ->orWhere('last_name_ar', 'like', "%{$search}%")
                        ->orWhere('national_id', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->with(['teacher.grade'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($u) {
                $u->grade_id = $u->teacher?->grade_id;
                $u->grade_name = $u->teacher?->grade?->name;

                return $u;
            });

        $counts = [
            'all' => $teachers->count(),
            'active' => $teachers->where('is_active', true)->count(),
            'inactive' => $teachers->where('is_active', false)->count(),
        ];

        return Inertia::render('School/Teachers/Index', [
            'teachers' => $teachers,
            'counts' => $counts,
            'filters' => $request->only(['search']),
            'grades' => \App\Models\Grade::where('school_id', $schoolId)
                ->with('teacher.user')
                ->orderBy('name')
                ->get()
                ->map(fn ($g) => [
                    'id' => $g->id,
                    'name' => $g->name,
                    'teacher_name' => $g->teacher?->user?->name,
                ]),
        ]);
    }

    /**
     * إنشاء معلم جديد
     */
    public function store(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $schoolId = $user->getSchoolId();

        $validated = $request->validate([
            'first_name_ar' => 'required|string|max:255',
            'last_name_ar' => 'required|string|max:255',
            'first_name_en' => 'nullable|string|max:255',
            'last_name_en' => 'nullable|string|max:255',
            'national_id' => ['required', 'string', 'max:20', Rule::unique('users', 'national_id')],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['required', 'string', 'max:50', Rule::unique('users', 'phone')],
            'password' => 'nullable|string|min:6',
            'is_active' => 'required|boolean',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'grade_id' => [
                'nullable',
                'exists:grades,id',
                Rule::unique('teachers', 'grade_id'),
            ],
            'preferred_language' => 'nullable|string|in:ar,en',
            'address' => 'nullable|string|max:500',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('teachers', 'public');
        }

        $schoolId = $user->getSchoolId();

        \DB::transaction(function () use ($validated, $imagePath, $schoolId) {
            $teacherUser = User::create([
                'first_name_ar' => $validated['first_name_ar'],
                'last_name_ar' => $validated['last_name_ar'],
                'first_name_en' => $validated['first_name_en'] ?? '',
                'last_name_en' => $validated['last_name_en'] ?? '',
                'national_id' => $validated['national_id'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make(
                    $validated['password'] ?? $validated['phone']
                ),
                'image' => $imagePath,
                'preferred_language' => $validated['preferred_language'] ?? 'ar',
                'address' => $validated['address'] ?? null,
            ]);

            // Attach role
            $role = \App\Models\Role::firstOrCreate(['name' => 'teacher']);
            $teacherUser->roles()->attach($role->id);

            // Create teacher record
            \App\Models\Teacher::create([
                'user_id' => $teacherUser->id,
                'school_id' => $schoolId,
                'grade_id' => $validated['grade_id'] ?? null,
                'status' => $validated['is_active'] ? 'active' : 'inactive',
            ]);
        });

        return redirect()
            ->route('school.teachers.index')
            ->with('success', 'Teacher created successfully.');
    }

    /**
     * تحديث بيانات معلم
     */
    public function update(Request $request, User $teacher)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (
            $teacher->getSchoolId() !== $user->getSchoolId() ||
            ! $teacher->hasRole('teacher')
        ) {
            abort(403);
        }

        $validated = $request->validate([
            'first_name_ar' => 'required|string|max:255',
            'last_name_ar' => 'required|string|max:255',
            'first_name_en' => 'nullable|string|max:255',
            'last_name_en' => 'nullable|string|max:255',
            'national_id' => [
                'required',
                'string',
                'max:20',
                Rule::unique('users', 'national_id')->ignore($teacher->id),
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($teacher->id),
            ],
            'phone' => ['required', 'string', 'max:50', Rule::unique('users', 'phone')->ignore($teacher->id)],
            'is_active' => 'required|boolean',
            'password' => 'nullable|string|min:6',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'grade_id' => [
                'nullable',
                'exists:grades,id',
                Rule::unique('teachers', 'grade_id')->ignore($teacher->id, 'user_id'),
            ],
            'remove_image' => 'nullable|boolean',
            'preferred_language' => 'nullable|string|in:ar,en',
            'address' => 'nullable|string|max:500',
        ]);

        $updateData = [
            'first_name_ar' => $validated['first_name_ar'],
            'last_name_ar' => $validated['last_name_ar'],
            'first_name_en' => $validated['first_name_en'] ?? '',
            'last_name_en' => $validated['last_name_en'] ?? '',
            'national_id' => $validated['national_id'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'],
            'preferred_language' => $validated['preferred_language'] ?? 'ar',
            'address' => $validated['address'] ?? null,
        ];

        // معالجة رفع الصورة
        if ($request->hasFile('image')) {
            if ($teacher->image) {
                Storage::disk('public')->delete($teacher->image);
            }
            $updateData['image'] = $request->file('image')->store('teachers', 'public');
        } elseif ($request->boolean('remove_image')) {
            if ($teacher->image) {
                Storage::disk('public')->delete($teacher->image);
            }
            $updateData['image'] = null;
        }

        $teacher->update($updateData);

        // تحديث كلمة المرور إذا أُدخلت
        if (! empty($validated['password'])) {
            $teacher->update(['password' => Hash::make($validated['password'])]);
        }

        // تحديث المرحلة في بروفايل المعلم
        if ($teacher->teacher) {
            $teacher->teacher->update([
                'grade_id' => $validated['grade_id'] ?? null,
                'status' => $validated['is_active'] ? 'active' : 'inactive',
            ]);
        }

        return redirect()
            ->route('school.teachers.index')
            ->with('success', 'Teacher updated successfully.');
    }

    /**
     * حذف مشرف
     */
    public function destroy(User $teacher)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (
            $teacher->getSchoolId() !== $user->getSchoolId() ||
            ! $teacher->hasRole('teacher')
        ) {
            abort(403);
        }

        $teacher->delete();

        return redirect()
            ->route('school.teachers.index')
            ->with('success', 'Teacher deleted successfully.');
    }

    public function export()
    {
        $schoolId = Auth::user()->getSchoolId();

        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\TeachersExport(false, $schoolId), 'teachers.xlsx');
    }

    public function downloadTemplate()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\TeachersExport(true), 'teachers_template.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate(['file' => 'required|mimes:xlsx,xls,csv|max:10240']);
        $schoolId = Auth::user()->getSchoolId();
        $import = new \App\Imports\TeachersImport($schoolId);
        try {
            \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));
        } catch (\Throwable $e) {
            return redirect()->back()->with('import_errors', ['فشل في معالجة ملف الاستيراد: '.$e->getMessage()]);
        }
        $errorsArray = [];
        if ($import->failures()->isNotEmpty()) {
            $ca = (new \App\Imports\TeachersImport)->customValidationAttributes();
            foreach ($import->failures() as $f) {
                $ok = array_search($f->attribute(), $ca);
                $cn = $ok === false ? ($ca[$f->attribute()] ?? $f->attribute()) : $f->attribute();
                $bv = $f->values()[$ok === false ? $f->attribute() : $ok] ?? 'فارغة (Empty)';
                if (is_scalar($bv) && trim((string) $bv) === '') {
                    $bv = 'فارغة (Empty)';
                } if ($bv === null) {
                    $bv = 'فارغة (Empty)';
                }
                $errorsArray[] = "السطر {$f->row()} | العمود: [{$cn}] | القيمة: ({$bv}) | الخطأ: ".implode(' | ', $f->errors());
            }
        }
        if ($import->errors()->isNotEmpty()) {
            foreach ($import->errors() as $e) {
                $errorsArray[] = 'خطأ: '.$e->getMessage();
            }
        }
        if (! empty($errorsArray)) {
            return redirect()->back()->with('success', "تم استيراد {$import->successCount} معلم بنجاح.")->with('import_errors', $errorsArray);
        }

        return redirect()->back()->with('success', "تم استيراد {$import->successCount} معلم بنجاح وتحديث القائمة.");
    }

    public function printAll(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $schoolId = $user->getSchoolId();

        $query = User::query()
            ->atSchool($schoolId)
            ->withRole('teacher')
            ->with(['teacher.grade']);

        if ($s = $request->input('search')) {
            $query->where(function ($q) use ($s) {
                $q->where('first_name_ar', 'like', "%{$s}%")
                    ->orWhere('last_name_ar', 'like', "%{$s}%")
                    ->orWhere('national_id', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%");
            });
        }

        $data = $query->latest()->get()->map(fn ($t) => [
            'id' => $t->id, 'name' => $t->name, 'name_en' => $t->name_en, 'national_id' => $t->national_id,
            'phone' => $t->phone, 'email' => $t->email, 'preferred_language' => $t->preferred_language,
            'teacher' => $t->teacher ? ['status' => $t->teacher->status] : null,
        ]);
        $lang = $request->input('lang') ?? auth()->user()->preferred_language ?? 'ar';

        return Inertia::render('Print/SharedPrintReport', [
            'title_ar' => 'تقرير بيانات المعلمين', 'title_en' => 'Teachers Operational Report',
            'subtitle_ar' => 'إدارة شركة مسارات واصل', 'subtitle_en' => 'Masarat Wasel Company',
            'totalLabel_ar' => 'إجمالي الكادر', 'totalLabel_en' => 'Total Force',
            'columns' => [
                ['key' => 'name', 'label_ar' => 'المعلم', 'label_en' => 'Teacher', 'bold' => true],
                ['key' => 'national_id', 'label_ar' => 'الرقم المدني', 'label_en' => 'Civil ID', 'mono' => true],
                ['key' => 'phone', 'label_ar' => 'الجوال', 'label_en' => 'Phone'],
                ['key' => 'email', 'label_ar' => 'البريد', 'label_en' => 'Email'],
                ['key' => 'preferred_language', 'label_ar' => 'اللغة', 'label_en' => 'Language'],
            ],
            'data' => $data, 'printDate' => now()->format('Y-m-d H:i:s'), 'isRTL' => $lang === 'ar',
        ]);
    }
}
