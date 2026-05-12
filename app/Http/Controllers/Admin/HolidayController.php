<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use App\Models\School;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class HolidayController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function index()
    {
        $holidays = Holiday::with(['school', 'creator'])->latest()->get();
        $schools = School::select('id', 'name')->get();
        return Inertia::render('Admin/Holidays/Index', [
            'holidays' => $holidays,
            'schools' => $schools
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => 'nullable|exists:schools,id',
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'type' => 'required|in:official,school_specific,emergency',
            'notes' => 'nullable|string',
        ]);

        $validated['created_by'] = auth()->id();
        
        $holiday = Holiday::create($validated);

        // إرسال الإشعارات
        $this->sendHolidayNotifications($holiday);

        return redirect()->back()->with('success', 'تم تسجيل العطلة بنجاح وإرسال الإشعارات لمديري المدارس');
    }

    protected function sendHolidayNotifications(Holiday $holiday)
    {
        $title = "إجازة رسمية جديدة: " . $holiday->name;
        $titleEn = "New Holiday: " . $holiday->name;
        $message = "تم تسجيل إجازة من " . $holiday->start_date->format('Y-m-d') . " إلى " . $holiday->end_date->format('Y-m-d');
        $messageEn = "A new holiday has been recorded from " . $holiday->start_date->format('Y-m-d') . " to " . $holiday->end_date->format('Y-m-d');
        
        if ($holiday->school_id) {
            // تنبيه مدرسة محددة
            $this->notificationService->notifySchoolAdmins(
                $holiday->school_id,
                'holiday_announcement',
                $title,
                $message,
                ['holiday_id' => $holiday->id],
                'نظام الإدارة',
                $titleEn,
                $messageEn
            );
        } else {
            // تنبيه جميع مديري المدارس
            $adminIds = User::whereHas('roles', fn($q) => $q->where('name', 'school_admin'))
                ->pluck('id')
                ->toArray();

            if (!empty($adminIds)) {
                $this->notificationService->sendToUsers(
                    $adminIds,
                    'holiday_announcement',
                    $title,
                    $message,
                    ['holiday_id' => $holiday->id],
                    'نظام الإدارة',
                    $titleEn,
                    $messageEn
                );
            }
        }
    }

    public function update(Request $request, Holiday $holiday)
    {
        $validated = $request->validate([
            'school_id' => 'nullable|exists:schools,id',
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'type' => 'required|in:official,school_specific,emergency',
            'notes' => 'nullable|string',
        ]);

        $holiday->update($validated);
        $this->sendHolidayNotifications($holiday);
        return redirect()->back()->with('success', 'تم تحديث العطلة بنجاح وإرسال الإشعارات');
    }

    public function destroy(Holiday $holiday)
    {
        $holiday->delete();
        return redirect()->back()->with('success', 'تم حذف العطلة بنجاح');
    }
}
