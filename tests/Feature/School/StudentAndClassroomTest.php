<?php

namespace Tests\Feature\School;

use App\Models\Classroom;
use App\Models\Grade;
use App\Models\School;
use App\Models\Student;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesUsers;

class StudentAndClassroomTest extends TestCase
{
    use CreatesSchoolData, CreatesUsers;

    public function test_school_admin_can_access_dashboard_and_classrooms(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);

        $response = $this->actingAs($schoolAdmin)->get('/school/dashboard');
        $response->assertStatus(200);

        $responseClassrooms = $this->actingAs($schoolAdmin)->get('/school/classrooms');
        $responseClassrooms->assertStatus(200);
    }

    public function test_school_admin_can_create_grade_and_classroom(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);

        // 1. Create Grade
        $responseGrade = $this->actingAs($schoolAdmin)->post('/school/classrooms/grades', [
            'name' => 'المرحلة الابتدائية',
        ]);
        $responseGrade->assertRedirect();
        $this->assertDatabaseHas('grades', ['school_id' => $school->id, 'name' => 'المرحلة الابتدائية']);

        $grade = Grade::where('school_id', $school->id)->first();

        // 2. Create Classroom
        $responseClass = $this->actingAs($schoolAdmin)->post('/school/classrooms', [
            'grade_id' => $grade->id,
            'name' => 'فصل 1/أ',
            'gender' => 'boys',
        ]);
        $responseClass->assertRedirect();
        $this->assertDatabaseHas('classrooms', ['grade_id' => $grade->id, 'name' => 'فصل 1/أ']);
    }

    public function test_school_admin_can_view_students_list(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);

        $student = Student::factory()->enrolled($school, $classroom)->create();

        $response = $this->actingAs($schoolAdmin)->get('/school/students');
        $response->assertStatus(200);
    }

    public function test_school_admin_can_search_grades_and_receive_teacher_assignment_metadata(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);

        $grade1 = Grade::factory()->create(['school_id' => $school->id, 'name' => 'الصف الأول الابتدائي']);
        $grade2 = Grade::factory()->create(['school_id' => $school->id, 'name' => 'المرحلة الثانوية']);

        $teacher = $this->createTeacher($school, $grade1, [
            'first_name_ar' => 'سليمان',
            'last_name_ar' => 'الغامدي',
        ]);

        // Link teacher in teachers table
        \App\Models\Teacher::updateOrCreate(
            ['user_id' => $teacher->id],
            ['school_id' => $school->id, 'grade_id' => $grade1->id]
        );

        // 1. Search by grade name
        $response = $this->actingAs($schoolAdmin)->get('/school/classrooms?search=الثانوية');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('School/Classrooms/Index')
            ->has('grades', 1)
            ->where('grades.0.id', $grade2->id)
        );

        // 2. Search classroom by name
        $classroom = Classroom::factory()->create(['grade_id' => $grade1->id, 'name' => 'فصل النخبة']);
        $responseClassroom = $this->actingAs($schoolAdmin)->get('/school/classrooms?search=النخبة');
        $responseClassroom->assertStatus(200);
        $responseClassroom->assertInertia(fn ($page) => $page
            ->component('School/Classrooms/Index')
            ->has('classrooms', 1)
            ->where('classrooms.0.id', $classroom->id)
        );

        // 3. Verify teacher assignment metadata is included in available teachers
        $responseAll = $this->actingAs($schoolAdmin)->get('/school/classrooms');
        $responseAll->assertStatus(200);
        $responseAll->assertInertia(fn ($page) => $page
            ->component('School/Classrooms/Index')
            ->where('teachers.0.assigned_grade_id', $grade1->id)
            ->where('teachers.0.assigned_grade_name', $grade1->name)
        );
    }

    public function test_student_can_be_enrolled_with_only_arabic_names_or_only_english_names(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);
        $guardian = $this->createGuardian();

        // 1. Enroll student with ONLY Arabic names (English names blank)
        $responseAr = $this->actingAs($schoolAdmin)->post('/school/students', [
            'first_name_ar' => 'سارة',
            'last_name_ar' => 'العتيبي',
            'first_name_en' => '',
            'last_name_en' => '',
            'national_id' => '1098765432',
            'gender' => 'female',
            'classroom_id' => $classroom->id,
            'guardians' => [
                [
                    'guardian_id' => $guardian->id,
                    'relationship_type' => 'mother',
                ],
            ],
        ]);
        $responseAr->assertSessionHasNoErrors();
        $this->assertDatabaseHas('students', [
            'national_id' => '1098765432',
            'first_name_ar' => 'سارة',
            'last_name_ar' => 'العتيبي',
            'first_name_en' => 'سارة',
            'last_name_en' => 'العتيبي',
        ]);

        // 2. Enroll student with ONLY English names (Arabic names blank)
        $responseEn = $this->actingAs($schoolAdmin)->post('/school/students', [
            'first_name_ar' => '',
            'last_name_ar' => '',
            'first_name_en' => 'John',
            'last_name_en' => 'Doe',
            'national_id' => '1098765433',
            'gender' => 'male',
            'classroom_id' => $classroom->id,
            'guardians' => [
                [
                    'guardian_id' => $guardian->id,
                    'relationship_type' => 'father',
                ],
            ],
        ]);
        $responseEn->assertSessionHasNoErrors();
        $this->assertDatabaseHas('students', [
            'national_id' => '1098765433',
            'first_name_ar' => 'John',
            'last_name_ar' => 'Doe',
            'first_name_en' => 'John',
            'last_name_en' => 'Doe',
        ]);

        // 3. Fail when neither Arabic nor English name is provided
        $responseFail = $this->actingAs($schoolAdmin)->post('/school/students', [
            'first_name_ar' => '',
            'last_name_ar' => '',
            'first_name_en' => '',
            'last_name_en' => '',
            'national_id' => '1098765434',
            'gender' => 'male',
            'classroom_id' => $classroom->id,
            'guardians' => [
                [
                    'guardian_id' => $guardian->id,
                    'relationship_type' => 'father',
                ],
            ],
        ]);
        $responseFail->assertSessionHasErrors('first_name_ar');
    }

    public function test_guardian_can_be_created_with_only_arabic_or_english_name(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);

        // 1. Guardian with Arabic name only
        $resAr = $this->actingAs($schoolAdmin)->post('/school/guardians', [
            'name' => 'محمد السالم',
            'name_en' => '',
            'national_id' => '1029384756',
            'phone' => '0501234567',
        ]);
        $resAr->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', [
            'national_id' => '1029384756',
            'first_name_ar' => 'محمد',
            'last_name_ar' => 'السالم',
        ]);

        // 2. Guardian with English name only
        $resEn = $this->actingAs($schoolAdmin)->post('/school/guardians', [
            'name' => '',
            'name_en' => 'Robert Smith',
            'national_id' => '1029384757',
            'phone' => '0501234568',
        ]);
        $resEn->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', [
            'national_id' => '1029384757',
            'first_name_en' => 'Robert',
            'last_name_en' => 'Smith',
        ]);
    }
}
