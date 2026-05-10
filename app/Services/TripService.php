<?php

namespace App\Services;

use App\Models\Trip;
use App\Models\TripAttendance;
use App\Models\Bus;
use App\Models\Student;
use App\Models\School;
use App\Models\AcademicCalendar;
use App\Models\Holiday;
use App\Models\AbsenceRequest;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TripService
{
    public function __construct(protected NotificationService $notificationService) {}

    /**
     * Automatically create daily trips (forth and back) for buses with assigned routes.
     */
    public function autoCreateDailyTrips(?Carbon $date = null): array
    {
        $targetDate = $date ?: Carbon::tomorrow(); // الافتراضي توليد رحلات الغد
        $dayName = strtolower($targetDate->englishDayOfWeek);

        Log::info('[DailyTrips] Auto-create started', ['date' => $targetDate->toDateString()]);

        $created = 0;
        $skipped = 0;
        $activeSchools = [];
        $reasons = [];
        $reasonsAr = [];

        // 1. فحص المدارس والتقويم الدراسي والعطل
        $schools = School::all();
        foreach ($schools as $school) {
            $calendar = AcademicCalendar::where('school_id', $school->id)
                ->where('is_active', true)
                ->where('start_date', '<=', $targetDate)
                ->where('end_date', '>=', $targetDate)
                ->first();

            if (!$calendar) {
                $reasons[] = "School {$school->name} has no active calendar.";
                $reasonsAr[] = "مدرسة {$school->name}: لا يوجد تقويم نشط.";
                Log::info("[DailyTrips] School {$school->id} skipped: No active calendar.");
                continue;
            }

            $workingDays = is_string($calendar->working_days) ? json_decode($calendar->working_days, true) : $calendar->working_days;
            $workingDays = $workingDays ?? [];
            if (!in_array($dayName, $workingDays)) {
                $dayAr = $dayTranslations[$dayName] ?? $targetDate->englishDayOfWeek;
                $reasons[] = "{$targetDate->englishDayOfWeek} is an off-day for school {$school->name}.";
                $reasonsAr[] = "مدرسة {$school->name}: يوم {$dayAr} هو يوم عطلة.";
                Log::info("[DailyTrips] School {$school->id} skipped: Not a working day ($dayName).");
                continue;
            }

            $isHoliday = Holiday::where(function($q) use ($school) {
                    $q->where('school_id', $school->id)->orWhereNull('school_id');
                })
                ->where('start_date', '<=', $targetDate)
                ->where('end_date', '>=', $targetDate)
                ->exists();

            if ($isHoliday) {
                $reasons[] = "{$targetDate->toDateString()} is a holiday for school {$school->name}.";
                $reasonsAr[] = "{$targetDate->toDateString()} هو يوم عطلة رسمية لمدرسة {$school->name}.";
                Log::info("[DailyTrips] School {$school->id} skipped: Holiday.");
                continue;
            }

            $activeSchools[] = $school->id;
        }

        if (empty($activeSchools)) {
            Log::info('[DailyTrips] No active schools found for this date. Exiting.');
            return [
                'created' => 0, 
                'skipped' => 0, 
                'status' => 'skipped', 
                'reason' => count($reasons) > 0 ? implode(' ', array_unique($reasons)) : 'No schools are active for this date.',
                'reason_ar' => count($reasonsAr) > 0 ? implode(' ', array_unique($reasonsAr)) : 'لا توجد مدارس نشطة في هذا التاريخ.'
            ];
        }

        // 2. معالجة الباصات بنظام الـ Chunking لتوفير الذاكرة
        Bus::whereIn('school_id', $activeSchools)
            ->whereNotNull('route_id')
            ->chunk(50, function ($buses) use ($targetDate, &$created, &$skipped) {
                foreach ($buses as $bus) {
                    DB::transaction(function () use ($bus, $targetDate, &$created, &$skipped) {
                        [$forthResult, $forthReason] = $this->createDailyTrip($bus, 'forth', $targetDate);
                        [$backResult, $backReason]   = $this->createDailyTrip($bus, 'back', $targetDate);

                        if ($forthResult) { $created++; } else { $skipped++; }
                        if ($backResult)  { $created++; } else { $skipped++; }

                        Log::info("[DailyTrips] Bus {$bus->id} ({$bus->bus_number})", [
                            'forth' => $forthResult ? 'created' : "skipped ($forthReason)",
                            'back'  => $backResult  ? 'created' : "skipped ($backReason)",
                        ]);
                    });
                }
            });

        Log::info('[DailyTrips] Auto-create finished', [
            'date'    => $targetDate->toDateString(),
            'created' => $created,
            'skipped' => $skipped,
        ]);

        return [
            'created' => $created,
            'skipped' => $skipped,
            'status' => 'completed'
        ];
    }

    /**
     * Validate if a specific date is a working day, holiday, or has no calendar.
     * Returns ['status' => string, 'message' => string, 'is_working' => bool]
     */
    public function validateTargetDate(Carbon $date): array
    {
        $dayName = strtolower($date->englishDayOfWeek);
        $schools = School::all();
        
        if ($schools->isEmpty()) {
            return [
                'status' => 'no_schools',
                'message' => 'No schools found in the system.',
                'message_ar' => 'لا توجد مدارس في النظام.',
                'is_working' => false
            ];
        }

        $activeCount = 0;
        $reasons = [];
        $reasonsAr = [];

        $dayTranslations = [
            'sunday' => 'الأحد',
            'monday' => 'الاثنين',
            'tuesday' => 'الثلاثاء',
            'wednesday' => 'الأربعاء',
            'thursday' => 'الخميس',
            'friday' => 'الجمعة',
            'saturday' => 'السبت',
        ];

        foreach ($schools as $school) {
            $calendar = AcademicCalendar::where('school_id', $school->id)
                ->where('is_active', true)
                ->where('start_date', '<=', $date)
                ->where('end_date', '>=', $date)
                ->first();

            if (!$calendar) {
                $reasons[] = "School {$school->name}: No active calendar.";
                $reasonsAr[] = "مدرسة {$school->name}: لا يوجد تقويم نشط.";
                continue;
            }

            $workingDays = is_string($calendar->working_days) ? json_decode($calendar->working_days, true) : $calendar->working_days;
            if (!in_array($dayName, $workingDays ?? [])) {
                $dayAr = $dayTranslations[$dayName] ?? $dayName;
                $reasons[] = "School {$school->name}: {$date->englishDayOfWeek} is an off-day.";
                $reasonsAr[] = "مدرسة {$school->name}: يوم {$dayAr} هو يوم عطلة.";
                continue;
            }

            $isHoliday = Holiday::where(function($q) use ($school) {
                    $q->where('school_id', $school->id)->orWhereNull('school_id');
                })
                ->where('start_date', '<=', $date)
                ->where('end_date', '>=', $date)
                ->exists();

            if ($isHoliday) {
                $reasons[] = "School {$school->name}: Today is a holiday.";
                $reasonsAr[] = "مدرسة {$school->name}: هذا اليوم عطلة رسمية.";
                continue;
            }

            $activeCount++;
        }

        if ($activeCount > 0) {
            return [
                'status' => 'working',
                'message' => "Confirmed: {$activeCount} school(s) have a working day on this date.",
                'message_ar' => "تأكيد: {$activeCount} مدرسة لديها دوام في هذا التاريخ.",
                'is_working' => true
            ];
        }

        return [
            'status' => 'skipped',
            'message' => count($reasons) > 0 ? implode(' ', array_unique($reasons)) : 'This date is not a working day for any school.',
            'message_ar' => count($reasonsAr) > 0 ? implode(' ', array_unique($reasonsAr)) : 'هذا التاريخ ليس يوم عمل لأي مدرسة.',
            'is_working' => false
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

        if (!$bus->driver_id || !$bus->route_id) {
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
            $status = 'absent'; // الافتراضي غائب حتى يركب

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

        return [$trip, 'created'];
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
            $this->notificationService->notifyStudentGuardian(
                studentId: $studentId,
                type: 'bus_boarding',
                title: '🚌 ركب الحافلة',
                message: 'تم تسجيل ركوب الطالب في رحلة ' . ($trip->type === 'forth' ? 'الذهاب' : 'العودة'),
                titleEn: '🚌 Boarded the bus',
                messageEn: 'The student has been recorded as boarded for the ' . ($trip->type === 'forth' ? 'forth' : 'back') . ' trip.'
            );
        } elseif ($status === 'dropped') {
            $updateData['check_out_time'] = now();
            $this->notificationService->notifyStudentGuardian(
                studentId: $studentId,
                type: 'bus_alighting',
                title: '✅ نزل من الحافلة',
                message: 'تم تسجيل نزول الطالب من الرحلة بأمان',
                titleEn: '✅ Alighted from the bus',
                messageEn: 'The student has been recorded as safely alighted from the trip.'
            );
        }

        $attendance->update($updateData);
    }
}


