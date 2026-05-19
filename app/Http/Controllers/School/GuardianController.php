<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class GuardianController extends Controller
{
    /**
     * [Read] عرض قائمة أولياء الأمور المرتبطين بمدرسة المدير
     */
    public function index(Request $request)
    {
        $schoolId = Auth::user()->getSchoolId();
        $search   = $request->input('search');

        // أولياء الأمور المرتبطون بطلاب في هذه المدرسة
        // نعدل الاستعلام ليشمل أيضاً أولياء الأمور الذين ليس لديهم طلاب بعد (ليظهروا فور إضافتهم)
        $guardians = User::withRole('parent')
            ->where(function ($query) use ($schoolId) {
                $query->whereHas('students.enrollments.classroom', function ($q) use ($schoolId) {
                    $q->atSchool($schoolId);
                })
                ->orWhereDoesntHave('students'); // السماح بظهور أولياء الأمور الجدد الذين لم يتم ربطهم بطلاب بعد
            })
            ->with([
                'guardian:user_id,status',
                'students' => function ($q) use ($schoolId) {
                    $q->whereHas('enrollments.classroom', fn($eq) => $eq->atSchool($schoolId))
                      ->with(['currentEnrollment.classroom:id,name']);
                },
            ])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name_ar', 'ilike', "%{$search}%")
                      ->orWhere('last_name_ar', 'ilike', "%{$search}%")
                      ->orWhere('national_id', 'ilike', "%{$search}%")
                      ->orWhere('phone', 'ilike', "%{$search}%")
                      ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id'                 => $user->id,
                    'first_name_ar'      => $user->first_name_ar,
                    'last_name_ar'       => $user->last_name_ar,
                    'first_name_en'      => $user->first_name_en,
                    'last_name_en'       => $user->last_name_en,
                    'name'               => $user->name ?? trim("{$user->first_name_ar} {$user->last_name_ar}"),
                    'name_en'            => $user->name_en ?? trim("{$user->first_name_en} {$user->last_name_en}"),
                    'national_id'        => $user->national_id,
                    'phone'              => $user->phone,
                    'email'              => $user->email,
                    'address'            => $user->address,
                    'image'              => $user->image,
                    'preferred_language' => $user->preferred_language,
                    'status'             => $user->guardian?->status ?? 'active',
                    'students'     => $user->students->map(fn($s) => [
                        'id'         => $s->id,
                        'name'       => $s->name ?? trim("{$s->first_name_ar} {$s->last_name_ar}"),
                        'national_id'=> $s->national_id,
                        'student_code' => $s->student_code,
                        'image'      => $s->image,
                        'classroom'  => $s->currentEnrollment?->classroom?->name ?? '—',
                    ]),
                ];
            });
        // حساب الإحصائيات من البيانات المسترجعة
        $stats = [
            'total'          => $guardians->count(),
            'active'         => $guardians->where('status', 'active')->count(),
            'inactive'       => $guardians->where('status', 'inactive')->count(),
            'with_students'  => $guardians->filter(fn($g) => count($g['students']) > 0)->count(),
            'no_students'    => $guardians->filter(fn($g) => count($g['students']) === 0)->count(),
            'multi_students' => $guardians->filter(fn($g) => count($g['students']) > 1)->count(),
            'ar_lang'        => $guardians->where('preferred_language', 'ar')->count(),
            'en_lang'        => $guardians->where('preferred_language', 'en')->count(),
        ];

        return Inertia::render('School/Guardians/Index', [
            'guardians' => $guardians,
            'stats'     => $stats,
            'filters'   => $request->only(['search']),
        ]);
    }

    /**
     * [Create] إنشاء ولي أمر جديد
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name_ar'      => 'required|string|max:255',
            'last_name_ar'       => 'required|string|max:255',
            'first_name_en'      => 'required|string|max:255',
            'last_name_en'       => 'required|string|max:255',
            'national_id'        => 'required|string|max:50|unique:users,national_id',
            'phone'              => 'required|string|max:50|unique:users,phone',
            'email'              => 'nullable|email|max:255|unique:users,email',
            'address'            => 'nullable|string|max:500',
            'status'             => 'nullable|in:active,inactive',
            'preferred_language' => 'nullable|in:ar,en',
            'image'              => 'nullable|image|max:2048',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $user = User::create([
                'first_name_ar'      => $validated['first_name_ar'],
                'last_name_ar'       => $validated['last_name_ar'],
                'first_name_en'      => $validated['first_name_en'],
                'last_name_en'       => $validated['last_name_en'],
                'national_id'        => $validated['national_id'],
                'phone'              => preg_replace('/\s+/', '', $validated['phone']),
                'email'              => $validated['email'] ?? null,
                'address'            => $validated['address'] ?? null,
                'password'           => Hash::make($validated['phone']),
                'preferred_language' => $validated['preferred_language'] ?? 'ar',
                'image'              => $request->hasFile('image') ? $request->file('image')->store('users', 'public') : null,
            ]);

            $role = Role::firstOrCreate(['name' => 'parent']);
            $user->roles()->attach($role->id);

            Guardian::create([
                'user_id' => $user->id,
                'status'  => $validated['status'] ?? 'active',
            ]);
        });

        return redirect()->back()->with('success', 'Parent added successfully.');
    }

    /**
     * [Update] تحديث بيانات ولي الأمر
     */
    public function update(Request $request, User $parent)
    {
        $validated = $request->validate([
            'first_name_ar'      => 'required|string|max:255',
            'last_name_ar'       => 'required|string|max:255',
            'first_name_en'      => 'required|string|max:255',
            'last_name_en'       => 'required|string|max:255',
            'national_id'        => ['required', 'string', 'max:50', Rule::unique('users', 'national_id')->ignore($parent->id)],
            'phone'              => ['required', 'string', 'max:50', Rule::unique('users', 'phone')->ignore($parent->id)],
            'email'              => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($parent->id)],
            'address'            => 'nullable|string|max:500',
            'status'             => 'nullable|in:active,inactive',
            'preferred_language' => 'nullable|in:ar,en',
            'image'              => 'nullable|image|max:2048',
        ]);

        DB::transaction(function () use ($validated, $parent, $request) {
            $parent->update([
                'first_name_ar'      => $validated['first_name_ar'],
                'last_name_ar'       => $validated['last_name_ar'],
                'first_name_en'      => $validated['first_name_en'],
                'last_name_en'       => $validated['last_name_en'],
                'national_id'        => $validated['national_id'],
                'phone'              => preg_replace('/\s+/', '', $validated['phone']),
                'email'              => $validated['email'] ?? null,
                'address'            => $validated['address'] ?? null,
                'preferred_language' => $validated['preferred_language'] ?? 'ar',
            ]);

            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($parent->image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($parent->image);
                }
                $parent->update(['image' => $request->file('image')->store('users', 'public')]);
            }

            if ($parent->guardian) {
                $parent->guardian->update(['status' => $validated['status'] ?? 'active']);
            } else {
                Guardian::create(['user_id' => $parent->id, 'status' => $validated['status'] ?? 'active']);
            }
        });

        return redirect()->back()->with('success', 'Parent updated successfully.');
    }

    /**
     * [Delete] حذف ولي الأمر أو فصله من طلاب المدرسة
     */
    public function destroy(User $parent)
    {
        $schoolId = Auth::user()->getSchoolId();

        try {
            DB::transaction(function () use ($parent, $schoolId) {
                // استخراج معرّفات الطلاب التابعين لهذا الولي والمسجلين في هذه المدرسة
                $studentsInSchool = $parent->students()
                    ->whereHas('enrollments.classroom', function ($q) use ($schoolId) {
                        $q->atSchool($schoolId);
                    })->pluck('students.id');

                // إلغ إلغاء ربط هؤلاء الطلاب بولي الأمر
                if ($studentsInSchool->isNotEmpty()) {
                    $parent->students()->detach($studentsInSchool);
                }

                // إذا لم يعد لدى ولي الأمر أي طلاب في النظام نهائياً، نحذفه بالكامل
                if ($parent->students()->count() === 0) {
                    // حذف صورته إن وجدت
                    if ($parent->image) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($parent->image);
                    }
                    // حذف أدواره المرتبطة
                    $parent->roles()->detach();
                    // حذف سجل ولي الأمر في جدول guardians (إن وُجد)
                    $parent->guardian()->delete();
                    // حذف المستخدم نفسه
                    $parent->delete();
                }
            });

            // إعادة التوجيه بعد الانتهاء — نتحقق إذا تم الحذف أو فقط الفصل
            if (!User::find($parent->id)) {
                return redirect()->back()->with('success', 'تم حذف ولي الأمر بنجاح.');
            }

            return redirect()->back()->with('success', 'تم فصل ولي الأمر من طلاب المدرسة بنجاح.');

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'حدث خطأ أثناء الحذف: ' . $e->getMessage());
        }
    }

    /**
     * [Relationship] إلغاء ربط طالب بولي أمر (بدون حذف الطالب)
     */
    public function detachStudent(User $parent, \App\Models\Student $student)
    {
        $parent->students()->detach($student->id);
        return redirect()->back()->with('success', 'Student detached successfully.');
    }

    public function export()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\GuardiansExport(false), 'parents.xlsx');
    }

    public function downloadTemplate()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\GuardiansExport(true), 'parents_template.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate(['file'=>'required|mimes:xlsx,xls,csv|max:10240']);
        $import = new \App\Imports\GuardiansImport();
        try { \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file')); }
        catch (\Throwable $e) { return redirect()->back()->with('import_errors',["فشل في معالجة ملف الاستيراد: ".$e->getMessage()]); }
        $errorsArray = [];
        if ($import->failures()->isNotEmpty()) {
            $ca = (new \App\Imports\GuardiansImport())->customValidationAttributes();
            foreach ($import->failures() as $f) {
                $ok = array_search($f->attribute(),$ca); $cn = $ok===false?($ca[$f->attribute()]??$f->attribute()):$f->attribute();
                $bv = $f->values()[$ok===false?$f->attribute():$ok]??'فارغة (Empty)';
                if (is_scalar($bv)&&trim((string)$bv)==='') $bv='فارغة (Empty)'; if ($bv===null) $bv='فارغة (Empty)';
                $errorsArray[]="السطر {$f->row()} | العمود: [{$cn}] | القيمة: ({$bv}) | الخطأ: ".implode(' | ',$f->errors());
            }
        }
        if ($import->errors()->isNotEmpty()) { foreach ($import->errors() as $e) { $errorsArray[]="خطأ: ".$e->getMessage(); } }
        if (!empty($errorsArray)) return redirect()->back()->with('success',"تم استيراد {$import->successCount} ولي أمر بنجاح.")->with('import_errors',$errorsArray);
        return redirect()->back()->with('success',"تم استيراد {$import->successCount} ولي أمر بنجاح وتحديث القائمة.");
    }
}
