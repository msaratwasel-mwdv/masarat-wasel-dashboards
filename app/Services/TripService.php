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

        // 1. فحص المدارس والتقويم الدراسي والعطل
        $schools = School::all();
        foreach ($schools as $school) {
            $calendar = AcademicCalendar::where('school_id', $school->id)
                ->where('is_active', true)
                ->where('start_date', '<=', $targetDate)
                ->where('end_date', '>=', $targetDate)
                ->first();

            if (!$calendar) {
                Log::info("[DailyTrips] School {$school->id} skipped: No active calendar.");
                continue;
            }

            $workingDays = is_string($calendar->working_days) ? json_decode($calendar->working_days, true) : $calendar->working_days;
            $workingDays = $workingDays ?? [];
            if (!in_array($dayName, $workingDays)) {
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
                Log::info("[DailyTrips] School {$school->id} skipped: Holiday.");
                continue;
            }

            $activeSchools[] = $school->id;
        }

        if (empty($activeSchools)) {
            Log::info('[DailyTrips] No active schools found for this date. Exiting.');
            return ['created' => 0, 'skipped' => 0];
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
                $studentId,
                'bus_boarding',
                '🚌 ركب الحافلة',
                'تم تسجيل ركوب الطالب في رحلة ' . ($trip->type === 'forth' ? 'الذهاب' : 'العودة')
            );
        } elseif ($status === 'dropped') {
            $updateData['check_out_time'] = now();
            $this->notificationService->notifyStudentGuardian(
                $studentId,
                'bus_alighting',
                '✅ نزل من الحافلة',
                'تم تسجيل نزول الطالب من الرحلة بأمان'
            );
        }

        $attendance->update($updateData);
    }
}


