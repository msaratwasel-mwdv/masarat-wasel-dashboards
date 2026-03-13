<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\AbsenceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AbsenceRequestController extends Controller
{
    /**
     * عرض قائمة طلبات الغياب لطلاب المدرسة
     */
    public function index()
    {
        $schoolId = Auth::user()->school_id;

        $requests = AbsenceRequest::whereHas('student', function($query) use ($schoolId) {
            $query->where('school_id', $schoolId);
        })
        ->with(['student:id,full_name', 'guardian:id,name'])
        ->latest()
        ->paginate(15);

        return Inertia::render('School/Students/AbsenceRequests', [
            'absenceRequests' => $requests,
        ]);
    }

    /**
     * معالجة الطلب (موافقة أو رفض)
     */
    public function process(Request $request, AbsenceRequest $absenceRequest)
    {
        $schoolId = Auth::user()->school_id;

        // التأكد أن الطالب يتبع لمدرسة المستخدم الحالي
        if ($absenceRequest->student->school_id !== $schoolId) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|nullable|string|max:500',
        ]);

        $absenceRequest->update([
            'status' => $validated['status'],
            'rejection_reason' => $validated['rejection_reason'] ?? null,
            'processed_by' => Auth::id(),
        ]);

        // إذا تمت الموافقة، يمكن إضافة الكود هنا لتحديث جدول الحضور (Attendance) يدوياً إذا رغبت
        // ولكن غالباً الحضور يتم تسجيله يومياً من قبل المعلم أو النظام
        // الطلب يخدم فقط كعذر مسبق.

        return redirect()->back()->with('success', 'تم تحديث حالة الطلب بنجاح.');
    }
}
