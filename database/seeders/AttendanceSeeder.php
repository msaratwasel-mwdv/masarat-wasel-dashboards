<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $students = Student::with('currentEnrollment')->get();

        foreach ($students as $student) {
            $classroom = $student->currentEnrollment?->classroom;
            if (!$classroom) continue;

            for ($d = 1; $d <= 10; $d++) {
                $status = rand(0, 10) > 2 ? 'present' : 'absent';
                $date = Carbon::now()->subDays(rand(0, 20));
                
                Attendance::firstOrCreate([
                    'student_id' => $student->id,
                    'date' => $date->format('Y-m-d'),
                ], [
                    'classroom_id' => $classroom->id,
                    'status' => $status
                ]);
            }
        }
    }
}
