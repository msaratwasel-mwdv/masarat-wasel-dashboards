<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\BusBoardingLog;
use App\Models\Student;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class BusBoardingController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * تسجيل ركوب طالب على الباص
     * POST /api/bus/{bus}/board
     */
    public function board(Request $request, Bus $bus)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'direction'  => 'required|in:to_school,to_home',
            'latitude'   => 'nullable|numeric',
            'longitude'  => 'nullable|numeric',
        ]);

        // التأكد أن الطالب مسجّل في هذا الباص
        $student = Student::findOrFail($request->student_id);
        $isAssigned = $bus->students()->where('student_id', $student->id)->wherePivot('is_active', true)->exists();

        if (! $isAssigned) {
            return response()->json(['message' => 'الطالب غير مسجّل في هذا الباص.'], 422);
        }

        $boardedAt = now();

        // تسجيل الركوب
        $log = BusBoardingLog::create([
            'student_id'  => $student->id,
            'bus_id'      => $bus->id,
            'type'        => 'boarding',
            'direction'   => $request->direction,
            'latitude'    => $request->latitude,
            'longitude'   => $request->longitude,
            'recorded_by' => $request->user()->id,
            'recorded_at' => $boardedAt,
        ]);

        // ═══════════════════════════════════════════════════
        // إرسال إشعار لولي الأمر حسب اتجاه الرحلة
        // ═══════════════════════════════════════════════════
        if ($request->direction === 'to_school') {
            // 🌅 ركوب صباحي - المهمة SCRUM-86
            $timeFormatted = $boardedAt->format('h:i A');

            $this->notificationService->notifyStudentGuardian(
                studentId: $student->id,
                type: 'bus_boarding_morning',
                title: '🚌 ركب الحافلة بأمان',
                message: "{$student->full_name} ركب حافلة رقم {$bus->bus_number} متوجهاً إلى المدرسة الساعة {$timeFormatted}.",
                data: [
                    'notification_type' => 'bus_boarding_morning',
                    'log_id'            => $log->id,
                    'bus_id'            => $bus->id,
                    'bus_number'        => $bus->bus_number,
                    'plate_number'      => $bus->plate_number,
                    'student_id'        => $student->id,
                    'student_name'      => $student->full_name,
                    'direction'         => 'to_school',
                    'boarded_at'        => $boardedAt->toIso8601String(),
                    'latitude'          => $request->latitude,
                    'longitude'         => $request->longitude,
                ],
            );
        } else {
            // 🌆 ركوب مسائي (عودة من المدرسة)
            $this->notificationService->notifyStudentGuardian(
                studentId: $student->id,
                type: 'bus_boarding_afternoon',
                title: '🚌 في طريقه إلى المنزل',
                message: "{$student->full_name} ركب حافلة {$bus->bus_number} عائداً من المدرسة.",
                data: [
                    'notification_type' => 'bus_boarding_afternoon',
                    'log_id'            => $log->id,
                    'bus_id'            => $bus->id,
                    'bus_number'        => $bus->bus_number,
                    'student_id'        => $student->id,
                    'student_name'      => $student->full_name,
                    'direction'         => 'to_home',
                    'boarded_at'        => $boardedAt->toIso8601String(),
                ],
            );
        }

        return response()->json([
            'message' => 'تم تسجيل ركوب الطالب بنجاح.',
            'log' => $log,
        ], 201);
    }

    /**
     * تسجيل نزول طالب من الباص
     * POST /api/bus/{bus}/alight
     */
    public function alight(Request $request, Bus $bus)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'direction'  => 'required|in:to_school,to_home',
            'latitude'   => 'nullable|numeric',
            'longitude'  => 'nullable|numeric',
        ]);

        $student = Student::findOrFail($request->student_id);

        // تسجيل النزول
        $log = BusBoardingLog::create([
            'student_id'  => $student->id,
            'bus_id'      => $bus->id,
            'type'        => 'alighting',
            'direction'   => $request->direction,
            'latitude'    => $request->latitude,
            'longitude'   => $request->longitude,
            'recorded_by' => $request->user()->id,
            'recorded_at' => now(),
        ]);

        // إشعار ولي الأمر
        if ($request->direction === 'to_home') {
            $this->notificationService->notifyStudentGuardian(
                studentId: $student->id,
                type: 'bus_alighting',
                title: 'وصول الطالب',
                message: "{$student->full_name} نزل من الباص بالقرب من المنزل.",
                data: [
                    'log_id' => $log->id,
                    'bus_id' => $bus->id,
                    'student_id' => $student->id,
                    'type' => 'alighting',
                    'direction' => 'to_home',
                ]
            );
        }

        return response()->json([
            'message' => 'تم تسجيل نزول الطالب بنجاح.',
            'log' => $log,
        ], 201);
    }

    /**
     * قائمة الطلاب الحاليين على الباص (الراكبين اليوم)
     * GET /api/bus/{bus}/passengers
     */
    public function passengers(Bus $bus)
    {
        // جلب الطلاب المسجلين في الباص مع آخر حدث لكل طالب اليوم
        $students = $bus->students()
            ->wherePivot('is_active', true)
            ->get()
            ->map(function ($student) use ($bus) {
                $lastLog = BusBoardingLog::where('student_id', $student->id)
                    ->where('bus_id', $bus->id)
                    ->today()
                    ->latest('recorded_at')
                    ->first();

                return [
                    'id' => $student->id,
                    'full_name' => $student->full_name,
                    'student_code' => $student->student_code,
                    'last_event' => $lastLog ? [
                        'type' => $lastLog->type,
                        'direction' => $lastLog->direction,
                        'time' => $lastLog->recorded_at->format('H:i'),
                    ] : null,
                    'is_on_bus' => $lastLog && $lastLog->type === 'boarding',
                ];
            });

        return response()->json([
            'bus' => [
                'id' => $bus->id,
                'bus_number' => $bus->bus_number,
                'plate_number' => $bus->plate_number,
            ],
            'passengers' => $students,
            'on_bus_count' => $students->where('is_on_bus', true)->count(),
            'total_count' => $students->count(),
        ]);
    }
}
