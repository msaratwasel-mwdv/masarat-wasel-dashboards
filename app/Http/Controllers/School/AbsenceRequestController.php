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
        $schoolId = Auth::user()->getSchoolId();

        $requests = AbsenceRequest::whereHas('student', function($query) use ($schoolId) {
            $query->inSchool($schoolId);
        })
        ->with(['student', 'guardian'])
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
        $schoolId = Auth::user()->getSchoolId();

        // التأكد أن الطالب يتبع لمدرسة المستخدم الحالي بطريقة موثوقة
        if (!\App\Models\Student::where('id', $absenceRequest->student_id)->inSchool($schoolId)->exists()) {
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

        // إرسال إشعار لولي الأمر
        $service = app(\App\Services\NotificationService::class);
        $studentNameAr = $absenceRequest->student->first_name_ar ?? $absenceRequest->student->full_name;
        $studentNameEn = $absenceRequest->student->full_name_en ?? $absenceRequest->student->full_name;
        
        $titleKey = $validated['status'] === 'approved' ? 'notifications.absence_approved_title' : 'notifications.absence_rejected_title';
        $messageKey = $validated['status'] === 'approved' ? 'notifications.absence_approved_message' : 'notifications.absence_rejected_message';
        
        $translationParams = ['student' => $studentNameAr];
        $translationParamsEn = ['student' => $studentNameEn];
        
        if ($validated['status'] === 'rejected' && $validated['rejection_reason']) {
            $translationParams['reason'] = $validated['rejection_reason'];
            $translationParamsEn['reason'] = $validated['rejection_reason']; // Could be English translated reason if available, but fallback to same
        }

        $service->sendTranslatedToUser(
            userId: $absenceRequest->guardian_id,
            type: 'absence_request_processed',
            titleKey: $titleKey,
            messageKey: $messageKey,
            translationParams: $translationParams,
            data: [
                'request_id' => $absenceRequest->id,
                'status' => $validated['status'],
                'student_id' => $absenceRequest->student_id,
                'category' => 'absence',
                'target_screen' => 'absence_history',
            ],
            translationParamsEn: $translationParamsEn
        );

        return redirect()->back()->with('success', 'تم تحديث حالة الطلب بنجاح.');
    }
}


