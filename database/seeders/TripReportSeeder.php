<?php

namespace Database\Seeders;

use App\Models\Bus;
use App\Models\BusBoardingLog;
use App\Models\BusGroup;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TripReportSeeder extends Seeder
{
    /**
     * بيانات تجريبية لاختبار تقارير الرحلات.
     * يستخدم البيانات الموجودة مسبقاً (الحافلات، المجموعات، الطلاب) ويضيف سجلات ركوب/نزول.
     */
    public function run(): void
    {
        $school = School::first();
        if (!$school) {
            $this->command->error('❌ لا توجد مدرسة. شغّل migrate:fresh --seed أولاً.');
            return;
        }

        // Get existing buses, groups, and students
        $buses = Bus::where('school_id', $school->id)->with(['supervisor', 'groups'])->get();
        if ($buses->isEmpty()) {
            $this->command->error('❌ لا توجد حافلات. شغّل migrate:fresh --seed أولاً.');
            return;
        }

        // Arabic student names for realistic data
        $arabicNames = [
            'وليد', 'ميرا', 'ماريا', 'علي', 'عاتف', 'مها', 'يمنى', 'رزان',
            'جاسم', 'أحمد', 'هيثم', 'يوسف', 'آية', 'ميرا عمر', 'منذر',
            'ماجد', 'نور مهدي', 'صالح مهدي', 'طه', 'فاطمة', 'جبار العبيري',
        ];

        // ============ Generate boarding logs for 3 test dates ============
        // Use today, yesterday, and day before
        $testDates = [
            Carbon::today(),
            Carbon::yesterday(),
            Carbon::today()->subDays(2),
        ];

        foreach ($buses as $bus) {
            $groups = $bus->groups;
            if ($groups->isEmpty()) continue;

            foreach ($groups as $group) {
                // Get students in this group
                $students = Student::where('morning_group_id', $group->id)
                    ->orWhere('afternoon_group_id', $group->id)
                    ->where('is_active', true)
                    ->get();

                if ($students->isEmpty()) continue;

                // Update student names to Arabic for better test display
                foreach ($students as $idx => $student) {
                    if (isset($arabicNames[$idx])) {
                        $student->update(['full_name' => $arabicNames[$idx]]);
                    }
                }

                foreach ($testDates as $date) {
                    // ===== Morning Trip (to_school) =====
                    $morningStartBase = $date->copy()->setTime(6, 30, 0);

                    foreach ($students as $idx => $student) {
                        // 70% of students arrive, 30% absent
                        $isPresent = $idx < (int)($students->count() * 0.7);

                        if ($isPresent) {
                            // Boarding time: each student boards 1-3 min after the previous
                            $boardingTime = $morningStartBase->copy()->addMinutes($idx * 2 + rand(0, 2))->addSeconds(rand(0, 59));

                            // Bus at door notification (~2 min before boarding)
                            $busAtDoorTime = $boardingTime->copy()->subMinutes(rand(1, 3));

                            // Boarding event
                            BusBoardingLog::create([
                                'student_id' => $student->id,
                                'bus_id' => $bus->id,
                                'type' => 'boarding',
                                'direction' => 'to_school',
                                'latitude' => 24.7136 + (rand(-100, 100) / 10000),
                                'longitude' => 46.6753 + (rand(-100, 100) / 10000),
                                'recorded_by' => $bus->supervisor_id,
                                'recorded_at' => $boardingTime,
                            ]);

                            // Alighting event (at school, ~30-50 min later)
                            $alightingTime = $boardingTime->copy()->addMinutes(rand(30, 50));

                            BusBoardingLog::create([
                                'student_id' => $student->id,
                                'bus_id' => $bus->id,
                                'type' => 'alighting',
                                'direction' => 'to_school',
                                'latitude' => 24.7200 + (rand(-50, 50) / 10000),
                                'longitude' => 46.6800 + (rand(-50, 50) / 10000),
                                'recorded_by' => $bus->supervisor_id,
                                'recorded_at' => $alightingTime,
                            ]);
                        }
                    }

                    // ===== Afternoon Trip (to_home) =====
                    $afternoonStartBase = $date->copy()->setTime(13, 0, 0);

                    foreach ($students as $idx => $student) {
                        $isPresent = $idx < (int)($students->count() * 0.7);

                        if ($isPresent) {
                            $boardingTime = $afternoonStartBase->copy()->addMinutes($idx * 2 + rand(0, 2))->addSeconds(rand(0, 59));

                            BusBoardingLog::create([
                                'student_id' => $student->id,
                                'bus_id' => $bus->id,
                                'type' => 'boarding',
                                'direction' => 'to_home',
                                'latitude' => 24.7200 + (rand(-50, 50) / 10000),
                                'longitude' => 46.6800 + (rand(-50, 50) / 10000),
                                'recorded_by' => $bus->supervisor_id,
                                'recorded_at' => $boardingTime,
                            ]);

                            $alightingTime = $boardingTime->copy()->addMinutes(rand(25, 45));

                            BusBoardingLog::create([
                                'student_id' => $student->id,
                                'bus_id' => $bus->id,
                                'type' => 'alighting',
                                'direction' => 'to_home',
                                'latitude' => 24.7136 + (rand(-100, 100) / 10000),
                                'longitude' => 46.6753 + (rand(-100, 100) / 10000),
                                'recorded_by' => $bus->supervisor_id,
                                'recorded_at' => $alightingTime,
                            ]);
                        }
                    }
                }
            }
        }

        $totalLogs = BusBoardingLog::count();
        $this->command->info("✅ Trip Report Test Data Seeded Successfully!");
        $this->command->info("   Total boarding logs created: {$totalLogs}");
        $this->command->info("   Test dates: " . implode(', ', array_map(fn($d) => $d->toDateString(), $testDates)));
        $this->command->info("   Use these dates in the 'From/To' filters to test.");
    }
}
