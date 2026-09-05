<?php

namespace Tests\Feature\School;

use App\Models\Classroom;
use App\Models\FieldTrip;
use App\Models\Grade;
use App\Models\School;
use App\Models\Student;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesUsers;

class FieldTripCreationTest extends TestCase
{
    use CreatesSchoolData, CreatesUsers;

    public function test_school_admin_can_create_field_trip_with_students_and_accompanying_teachers(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);

        $student = Student::factory()->enrolled($school, $classroom)->create([
            'national_id' => '1099887766',
        ]);

        $teacher = $this->createTeacher($school, $grade, [
            'national_id' => '2099887766',
        ]);

        $postData = [
            'name' => 'رحلة إلى واحة الملك سلمان',
            'description' => 'رحلة تعليمية واستكشافية',
            'date' => now()->addDays(3)->toDateString(),
            'departure_time' => '08:30',
            'arrival_time' => '12:30',
            'destination_address' => 'الرياض - حي الرائد',
            'destination_latitude' => 24.7136,
            'destination_longitude' => 46.6753,
            'student_ids' => [$student->id],
            'teacher_ids' => [$teacher->id],
        ];

        $response = $this->actingAs($schoolAdmin)
            ->from('/school/field-trips')
            ->post('/school/field-trips', $postData);

        $response->assertRedirect('/school/field-trips');
        $response->assertSessionHas('success');

        $fieldTrip = FieldTrip::where('school_id', $school->id)->latest('id')->first();
        $this->assertNotNull($fieldTrip);

        // Verify participant rows in database
        $this->assertDatabaseHas('field_trip_participants', [
            'field_trip_id' => $fieldTrip->id,
            'national_id' => $student->national_id,
            'type' => 'student',
        ]);

        $this->assertDatabaseHas('field_trip_participants', [
            'field_trip_id' => $fieldTrip->id,
            'national_id' => $teacher->national_id,
            'type' => 'user',
        ]);

        // Verify model relationships load properly with correct counts
        $this->assertCount(1, $fieldTrip->students);
        $this->assertEquals($student->national_id, $fieldTrip->students->first()->national_id);

        $this->assertCount(1, $fieldTrip->internalTeachers);
        $this->assertEquals($teacher->national_id, $fieldTrip->internalTeachers->first()->national_id);
    }

    public function test_field_trip_rejects_invalid_external_member(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);
        $student = Student::factory()->enrolled($school, $classroom)->create();

        $postData = [
            'name' => 'رحلة تجريبية',
            'description' => 'وصف الرحلة التجريبية',
            'date' => now()->addDays(3)->toDateString(),
            'departure_time' => '08:00',
            'destination_address' => 'موقع الرحلة',
            'destination_latitude' => 24.7,
            'destination_longitude' => 46.7,
            'student_ids' => [$student->id],
            'external_members' => [
                [
                    'name' => 'أ', // too short (< 3)
                    'phone' => '123', // too short (< 8)
                    'national_id' => '12', // too short (< 6)
                ],
            ],
        ];

        $response = $this->actingAs($schoolAdmin)
            ->from('/school/field-trips')
            ->post('/school/field-trips', $postData);

        $response->assertSessionHasErrors([
            'external_members.0.name',
            'external_members.0.phone',
            'external_members.0.national_id',
        ]);
    }

    public function test_field_trip_successfully_creates_external_member_participant(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);
        $student = Student::factory()->enrolled($school, $classroom)->create();

        $postData = [
            'name' => 'رحلة مع مرافق خارجي',
            'description' => 'وصف الرحلة الاستكشافية مع مرافقين',
            'date' => now()->addDays(2)->toDateString(),
            'departure_time' => '09:00',
            'destination_address' => 'معرض مشكاة التفاعلي',
            'destination_latitude' => 24.71,
            'destination_longitude' => 46.68,
            'student_ids' => [$student->id],
            'external_members' => [
                [
                    'name' => 'خالد بن ناصر العتيبي',
                    'phone' => '0555123456',
                    'national_id' => '1098765432',
                ],
            ],
        ];

        $response = $this->actingAs($schoolAdmin)
            ->from('/school/field-trips')
            ->post('/school/field-trips', $postData);

        $response->assertRedirect('/school/field-trips');
        $response->assertSessionHas('success');

        $fieldTrip = FieldTrip::where('school_id', $school->id)->latest('id')->first();
        $this->assertNotNull($fieldTrip);

        $this->assertDatabaseHas('field_trip_participants', [
            'field_trip_id' => $fieldTrip->id,
            'national_id' => '1098765432',
            'type' => 'external',
        ]);
    }
}
