<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\Grade;
use App\Models\School;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;

class ClassroomSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::first();
        if (! $school) {
            return;
        }

        $gradesAr = ['الصف الأول', 'الصف الثاني', 'الصف الثالث'];

        // Find teachers in this school
        $teachers = User::whereHas('roles', fn ($q) => $q->where('name', 'teacher'))
            ->whereHas('teacher', fn ($q) => $q->where('school_id', $school->id))
            ->get();

        foreach ($gradesAr as $index => $gradeName) {
            // 1. Create Grade
            $grade = Grade::updateOrCreate(
                ['school_id' => $school->id, 'name' => $gradeName]
            );

            // 2. Assign Teacher to Grade (1:1)
            if (isset($teachers[$index])) {
                $teacherExtension = Teacher::where('user_id', $teachers[$index]->id)->first();
                if ($teacherExtension) {
                    $teacherExtension->update(['grade_id' => $grade->id]);
                }
            }

            // 3. Create a couple of classrooms for this grade
            $gradesEn = ['Grade 1', 'Grade 2', 'Grade 3'];
            $gradeEnName = $gradesEn[$index] ?? 'Grade '.($index + 1);
            for ($c = 1; $c <= 2; $c++) {
                Classroom::updateOrCreate(
                    [
                        'grade_id' => $grade->id,
                        'name' => 'فصل '.$gradeName." ($c)",
                    ],
                    [
                        'name_en' => $gradeEnName." ($c)",
                    ]
                );
            }
        }
    }
}
