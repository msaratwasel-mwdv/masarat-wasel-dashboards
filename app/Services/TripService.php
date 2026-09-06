<?php

namespace App\Services;

use App\Models\AbsenceRequest;
use App\Models\Bus;
use App\Models\Holiday;
use App\Models\School;
use App\Models\Student;
use App\Models\Trip;
use App\Models\TripAttendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TripService
{
    public function __construct(protected NotificationService $notificationService) {}

    /**
     * Automatically create daily trips (forth and back) for buses with assigned routes.
     */
    public function autoCreateDailyTrips(?Carbon $date = null, bool $ignoreWeekend = false): array
    {
        // 1. تحديد تاريخ التنفيذ: الافتراضي هو اليوم الحالي بتوقيت عمان (عند التشغيل الساعة 2:00 فجراً لنفس يوم الدوام)
        $targetDate = $date ? $date->copy()->startOfDay() : Carbon::today('Asia/Muscat');
        $dayName = strtolower($targetDate->englishDayOfWeek);

        Log::info('[DailyTrips] Auto-create started', ['date' => $targetDate->toDateString(), 'day' => $dayName]);

        $created = 0;
        $skipped = 0;

        // ═══════════════════════════════════════════════════════════════
        // [شرط مؤقت يدوي - سهل الحذف والتعديل لاحقاً]:
        // استثناء يومي الجمعة والسبت من إنشاء الرحلات اليومية.
        // يمكن حذف هذا البلوك أو ربطه بجدول العطلات والتقويم المدرسي لاحقاً.
        // ═══════════════════════════════════════════════════════════════
        if (! $ignoreWeekend && ($targetDate->isFriday() || $targetDate->isSaturday())) {
            $dayAr = $targetDate->isFriday() ? 'الجمعة' : 'السبت';
            Log::info("[DailyTrips] Skipped: Today is weekend ({$targetDate->englishDayOfWeek}).");

            return [
                'created' => 0,
                'skipped' => 0,
                'status' => 'skipped',
                'reason' => "No trips created on weekends ({$targetDate->englishDayOfWeek}).",
                'reason_ar' => "لا يتم إنشاء رحلات في عطلة نهاية الأسبوع (يوم {$dayAr}).",
            ];
        }

        // 2. فحص المدارس الفعالة
        $schools = School::where('is_active', true)->get();
        if ($schools->isEmpty()) {
            $schools = School::all();
        }

        $activeSchools = $schools->pluck('id')->toArray();

        if (empty($activeSchools)) {
            Log::info('[DailyTrips] No schools found in the system. Exiting.');

            return [
                'created' => 0,
                'skipped' => 0,
                'status' => 'skipped',
                'reason' => 'No schools found in the system.',
                'reason_ar' => 'لا توجد مدارس في النظام.',
            ];
        }

        // 3. معالجة الباصات بنظام الـ Chunking لتوفير الذاكرة
        Bus::whereIn('school_id', $activeSchools)
            ->whereNotNull('route_id')
            ->whereNotNull('driver_id')
            ->chunk(50, function ($buses) use ($targetDate, &$created, &$skipped) {
                foreach ($buses as $bus) {
                    DB::transaction(function () use ($bus, $targetDate, &$created, &$skipped) {
                        [$forthResult, $forthReason] = $this->createDailyTrip($bus, 'forth', $targetDate);
                        [$backResult, $backReason] = $this->createDailyTrip($bus, 'back', $targetDate);

                        if ($forthResult) {
                            $created++;
                        } else {
                            $skipped++;
                        }
                        if ($backResult) {
                            $created++;
                        } else {
                            $skipped++;
                        }

                        Log::info("[DailyTrips] Bus {$bus->id} ({$bus->bus_number})", [
                            'forth' => $forthResult ? 'created' : "skipped ($forthReason)",
                            'back' => $backResult ? 'created' : "skipped ($backReason)",
                        ]);
                    });
                }
            });

        Log::info('[DailyTrips] Auto-create finished', [
            'date' => $targetDate->toDateString(),
            'created' => $created,
            'skipped' => $skipped,
        ]);

        return [
            'created' => $created,
            'skipped' => $skipped,
            'status' => 'completed',
        ];
    }

    /**
     * Validate if a specific date is a working day, holiday, or has no calendar.
     * Returns ['status' => string, 'message' => string, 'is_working' => bool]
     */
    public function validateTargetDate(Carbon $date): array
    {
        // ═══════════════════════════════════════════════════════════════
        // [شرط مؤقت يدوي - سهل الحذف والتعديل لاحقاً]:
        // استثناء يومي الجمعة والسبت من إنشاء الرحلات اليومية.
        // ═══════════════════════════════════════════════════════════════
        if ($date->isFriday() || $date->isSaturday()) {
            $dayAr = $date->isFriday() ? 'الجمعة' : 'السبت';

            return [
                'status' => 'skipped',
                'message' => "Weekend off-day ({$date->englishDayOfWeek}). No trips scheduled.",
                'message_ar' => "عطلة نهاية الأسبوع (يوم {$dayAr}). لا توجد رحلات مجدولة.",
                'is_working' => false,
            ];
        }

        $schoolsCount = School::where('is_active', true)->count();
        if ($schoolsCount === 0) {
            $schoolsCount = School::count();
        }

        if ($schoolsCount === 0) {
            return [
                'status' => 'no_schools',
                'message' => 'No schools found in the system.',
                'message_ar' => 'لا توجد مدارس في النظام.',
                'is_working' => false,
            ];
        }

        return [
            'status' => 'working',
            'message' => "Confirmed: {$schoolsCount} school(s) active on this date.",
            'message_ar' => "تأكيد: {$schoolsCount} مدرسة نشطة في هذا التاريخ.",
            'is_working' => true,
        ];
    }

    /**
     * Create a specific daily trip and its attendance records using Bulk Insert.
     * Returns [Trip|null, string reason]
     */
    public function createDailyTrip(Bus $bus, string $type, Carbon $date): array
    {
        $exists = Trip::where('bus_id', $bus->id)
            ->where('type', $type)
            ->whereDate('trip_date', $date)
            ->exists();

        if ($exists) {
            return [null, 'already_exists'];
        }

        if (! $bus->driver_id || ! $bus->route_id) {
            return [null, 'missing_staff_or_route'];
        }

        // Snapshot details
        $trip = Trip::create([
            'bus_id' => $bus->id,
            'school_id' => $bus->school_id,
            'driver_id' => $bus->driver_id,
            'route_id' => $bus->route_id,
            'trip_date' => $date,
            'type' => $type,
            'status' => 'pending',
            'generation_type' => 'auto',
        ]);

        $busField = $type === 'forth' ? 'forth_bus_id' : 'back_bus_id';
        $students = Student::where($busField, $bus->id)->where('is_active', true)->get();

        if ($students->isEmpty()) {
            return [$trip, 'no_students'];
        }

        $attendances = [];
        $now = now();

        // جلب طلبات الغياب المعتمدة لتسجيل الطالب كـ excused بدلاً من absent
        $studentIds = $students->pluck('id')->toArray();
        $absences = AbsenceRequest::whereIn('student_id', $studentIds)
            ->whereDate('date', $date)
            ->where('status', 'approved')
            ->get()
            ->groupBy('student_id');

        foreach ($students as $student) {
            $status = 'pending'; // الافتراضي قيد الانتظار حتى يركب أو يسجل غياب أو ينزل

            if ($absences->has($student->id)) {
                $studentAbsences = $absences->get($student->id);
                foreach ($studentAbsences as $absence) {
                    if ($absence->type === 'full_day' || $absence->type === ($type === 'forth' ? 'morning' : 'afternoon')) {
                        $status = 'excused'; // عذر مقبول
                        break;
                    }
                }
            }

            $attendances[] = [
                'trip_id' => $trip->id,
                'student_id' => $student->id,
                'status' => $status,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Bulk insert (سريع جداً للأعداد الكبيرة)
        TripAttendance::insert($attendances);

        // إرسال حدث WebSocket فوري لتطبيق ولي الأمر عند إنشاء الرحلة
        try {
            broadcast(new \App\Events\TripStatusUpdated($trip, $bus, 'pending'));
        } catch (\Exception $e) {
            Log::error('[TripService] Broadcast error (createDailyTrip): '.$e->getMessage());
        }

        return [$trip, 'created'];
    }

    /**
     * Sync trip attendances with the students currently assigned to the bus.
     */
    public function syncTripAttendances(Trip $trip): void
    {
        // Do not sync completed or cancelled trips to preserve historical records
        if (in_array($trip->status, ['completed', 'cancelled'])) {
            return;
        }

        $busId = $trip->bus_id;
        $type = $trip->type;
        $date = $trip->trip_date;

        $busField = $type === 'forth' ? 'forth_bus_id' : 'back_bus_id';

        // Get currently assigned active students
        $assignedStudentIds = Student::where($busField, $busId)
            ->where('is_active', true)
            ->pluck('id')
            ->toArray();

        // Get existing attendance student IDs
        $existingAttendances = TripAttendance::where('trip_id', $trip->id)->get();
        $existingStudentIds = $existingAttendances->pluck('student_id')->toArray();

        $studentsToAdd = array_diff($assignedStudentIds, $existingStudentIds);
        $studentsToRemove = array_diff($existingStudentIds, $assignedStudentIds);

        // 1. Remove students who are no longer assigned and haven't active attendance states
        if (! empty($studentsToRemove)) {
            TripAttendance::where('trip_id', $trip->id)
                ->whereIn('student_id', $studentsToRemove)
                ->whereIn('status', ['absent', 'waiting', 'excused'])
                ->delete();
        }

        // 2. Add newly assigned students
        if (! empty($studentsToAdd)) {
            $students = Student::whereIn('id', $studentsToAdd)->get();
            $absences = AbsenceRequest::whereIn('student_id', $studentsToAdd)
                ->whereDate('date', $date)
                ->where('status', 'approved')
                ->get()
                ->groupBy('student_id');

            $attendances = [];
            $now = now();

            foreach ($students as $student) {
                $status = 'pending';

                if ($absences->has($student->id)) {
                    $studentAbsences = $absences->get($student->id);
                    foreach ($studentAbsences as $absence) {
                        if ($absence->type === 'full_day' || $absence->type === ($type === 'forth' ? 'morning' : 'afternoon')) {
                            $status = 'excused';
                            break;
                        }
                    }
                }

                $attendances[] = [
                    'trip_id' => $trip->id,
                    'student_id' => $student->id,
                    'status' => $status,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (! empty($attendances)) {
                TripAttendance::insert($attendances);
            }
        }
    }

    /**
     * Initialize a field trip after admin approval.
     */
    public function initializeFieldTrip(\App\Models\FieldTrip $fieldTrip): void
    {
        DB::transaction(function () use ($fieldTrip) {
            $fieldTrip->update(['status' => 'approved']);
        });
    }

    /**
     * Mark student attendance status.
     */
    public function markAttendance(int $tripId, int $studentId, string $status): void
    {
        $attendance = TripAttendance::where('trip_id', $tripId)
            ->where('student_id', $studentId)
            ->firstOrFail();

        $trip = $attendance->trip;
        $updateData = ['status' => $status];

        if ($status === 'boarded') {
            $updateData['check_in_time'] = now();
            $studentName = $attendance->student->full_name ?? 'الطالب';
            $this->notificationService->notifyStudentGuardian(
                studentId: $studentId,
                type: 'bus_boarding',
                title: '🚌 ركب الحافلة',
                message: 'تم تسجيل ركوب الطالب ('.$studentName.') في رحلة '.($trip->type === 'forth' ? 'الذهاب' : 'العودة'),
                data: [
                    'student_id' => (string) $studentId,
                    'direction' => $trip->type === 'forth' ? 'to_school' : 'to_home',
                    'target_screen' => 'children_status',
                ],
                titleEn: '🚌 Boarded the bus',
                messageEn: 'Student ('.($attendance->student->full_name_en ?? $studentName).') has been recorded as boarded for the '.($trip->type === 'forth' ? 'forth' : 'back').' trip.'
            );
        } elseif ($status === 'dropped') {
            $updateData['check_out_time'] = now();
            $studentName = $attendance->student->full_name ?? 'الطالب';
            $this->notificationService->notifyStudentGuardian(
                studentId: $studentId,
                type: 'bus_alighting',
                title: '✅ نزل من الحافلة',
                message: 'تم تسجيل نزول الطالب ('.$studentName.') من الرحلة بأمان',
                data: [
                    'student_id' => (string) $studentId,
                    'direction' => $trip->type === 'forth' ? 'to_school' : 'to_home',
                    'target_screen' => 'children_status',
                ],
                titleEn: '✅ Alighted from the bus',
                messageEn: 'Student ('.($attendance->student->full_name_en ?? $studentName).') has been recorded as safely alighted from the trip.'
            );
        }

        $attendance->update($updateData);
    }
}
