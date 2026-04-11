<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\School;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;

class ClassroomSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::first();
        if (!$school) return;

        $gradesAr = ['الصف الأول', 'الصف الثاني', 'الصف الثالث'];
        
        // Find teachers in this school
        $teachers = User::whereHas('roles', fn($q) => $q->where('name', 'teacher'))
            ->whereHas('teacher', fn($q) => $q->where('school_id', $school->id))
            ->get();

        foreach ($gradesAr as $index => $gradeName) {
            $classroom = Classroom::updateOrCreate(
                ['school_id' => $school->id, 'name' => $gradeName]
            );

            if (isset($teachers[$index])) {
                $teacherExtension = Teacher::where('user_id', $teachers[$index]->id)->first();
                if ($teacherExtension) {
                    $teacherExtension->update(['classroom_id' => $classroom->id]);
                }
            }
        }
    }
}
