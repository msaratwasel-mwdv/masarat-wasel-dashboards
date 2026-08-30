<?php

namespace Database\Seeders;

use App\Models\Bus;
use App\Models\Classroom;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $fakerAr = \Faker\Factory::create('ar_SA');
        $fakerEn = \Faker\Factory::create('en_US');

        $getNames = function ($gender = null) use ($fakerAr, $fakerEn) {
            return [
                'ar' => [$fakerAr->firstName($gender), $fakerAr->lastName],
                'en' => [$fakerEn->firstName($gender), $fakerEn->lastName],
            ];
        };

        $school = School::first();
        if (! $school) {
            return;
        }

        $classrooms = Classroom::atSchool($school->id)->get();
        $buses = Bus::where('school_id', $school->id)->get();

        $guardians = User::whereHas('roles', fn ($q) => $q->where('name', 'parent'))->get();

        foreach ($guardians as $index => $guardian) {
            $numStudents = rand(1, 2);
            for ($s = 1; $s <= $numStudents; $s++) {
                $assignedBus = $buses->isNotEmpty() ? $buses->random() : null;
                $classroom = $classrooms->isNotEmpty() ? $classrooms->random() : null;

                $gender = $s % 2 == 0 ? 'female' : 'male';
                $stNames = $getNames($gender);

                $student = Student::updateOrCreate(
                    ['national_id' => '20030040'.$guardian->id.$s],
                    [
                        'first_name_ar' => $stNames['ar'][0],
                        'last_name_ar' => $guardian->last_name_ar,
                        'first_name_en' => $stNames['en'][0],
                        'last_name_en' => $guardian->last_name_en,

                        'student_code' => 'STU-'.$guardian->id."-$s",
                        'gender' => $gender,
                        'forth_bus_id' => $assignedBus?->id,
                        'back_bus_id' => $assignedBus?->id,
                        'is_active' => true,
                    ]
                );

                // Link to guardian
                $student->guardians()->syncWithoutDetaching([
                    $guardian->id => ['relationship_type' => 'Father'],
                ]);

                // Enroll Student
                if ($classroom) {
                    $student->enrollments()->firstOrCreate([
                        'classroom_id' => $classroom->id,
                        'is_active' => true,
                    ]);
                }
            }
        }
    }
}
