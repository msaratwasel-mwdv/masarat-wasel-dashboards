<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSchoolRequest;
use App\Models\School;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SchoolController extends Controller
{
    public function index()
    {
        $schools = School::latest()->get();

        return Inertia::render('Admin/Schools/Index', [
            'schools' => $schools
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Schools/Create');
    }

    public function store(StoreSchoolRequest $request)
    {
        // 1. استخدام البيانات التي تم التحقق منها مباشرة (أنظف وأكثر أماناً)
        // هذا تلقائياً يجلب البيانات المعرفة في rules() فقط
        School::create($request->validated());

        return redirect()->route('admin.schools.index');
    }

    public function show(School $school)
    {
        $school->load(['users' => function ($query) {
            $query->where('role', 'school_admin');
        }]);

        return Inertia::render('Admin/Schools/Show', [
            'school' => $school,
            'stats' => [
                'students_count' => 0,
                'buses_count' => 0,
                'drivers_count' => 0,
            ]
        ]);
    }

    public function edit(School $school)
    {
        return Inertia::render('Admin/Schools/Edit', [
            'school' => $school
        ]);
    }

    public function update(StoreSchoolRequest $request, School $school)
    {
        // تم إصلاح المسافات الزائدة هنا باستخدام validated() أيضاً
        $school->update($request->validated());

        return redirect()->route('admin.schools.index')
            ->with('message', 'School updated successfully');
    }

    public function destroy(School $school)
    {
        $school->delete();

        return redirect()->route('admin.schools.index')
            ->with('message', 'School deleted successfully');
    }

    public function toggleStatus(School $school)
    {
        $school->status = $school->status === 'Active' ? 'Inactive' : 'Active';
        $school->save();

        return back()->with('message', 'تم تحديث حالة المدرسة بنجاح');
    }
}
