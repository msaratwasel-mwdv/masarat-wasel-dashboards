<?php

namespace Tests\Unit\Models;

use App\Models\Bus;
use App\Models\BusDocument;
use App\Models\ChatParticipant;
use App\Models\Conversation;
use App\Models\FieldTrip;
use App\Models\FieldTripParticipant;
use App\Models\Grade;
use App\Models\School;
use App\Models\Student;
use App\Models\StudentLocationRequest;
use App\Models\Teacher;
use App\Models\User;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class AdditionalModelsTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    public function test_teacher_model_relations_and_attributes(): void
    {
        $school = School::factory()->create();
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $user = User::factory()->create(['first_name_ar' => 'أحمد', 'last_name_ar' => 'الأستاذ']);

        $teacher = Teacher::create([
            'user_id' => $user->id,
            'school_id' => $school->id,
            'grade_id' => $grade->id,
            'status' => 'active',
        ]);

        $this->assertEquals($user->id, $teacher->user->id);
        $this->assertEquals($school->id, $teacher->school->id);
        $this->assertEquals($grade->id, $teacher->grade->id);
        $this->assertNotEmpty($teacher->name);
    }

    public function test_student_location_request_relations_and_casts(): void
    {
        $school = School::factory()->create();
        $student = Student::factory()->create();
        $guardian = $this->createGuardian();

        $request = StudentLocationRequest::create([
            'student_id' => $student->id,
            'guardian_id' => $guardian->id,
            'school_id' => $school->id,
            'old_latitude' => 15.3500,
            'old_longitude' => 44.2000,
            'new_latitude' => 15.3600,
            'new_longitude' => 44.2100,
            'status' => 'pending',
            'note' => 'انتقال إلى منزل جديد',
        ]);

        $this->assertEquals($student->id, $request->student->id);
        $this->assertEquals($school->id, $request->school->id);
        $this->assertIsFloat($request->new_latitude);
        $this->assertEquals(15.3600, $request->new_latitude);
    }

    public function test_bus_document_creation_and_attributes(): void
    {
        $school = School::factory()->create();
        $bus = Bus::factory()->create(['school_id' => $school->id]);

        $doc = BusDocument::create([
            'bus_id' => $bus->id,
            'type' => 'insurance',
            'file_path' => 'documents/insurance_2026.pdf',
            'expiry_date' => '2027-01-01',
        ]);

        $this->assertDatabaseHas('bus_documents', [
            'id' => $doc->id,
            'bus_id' => $bus->id,
            'type' => 'insurance',
        ]);
    }

    public function test_chat_participant_model_relations(): void
    {
        $conversation = Conversation::factory()->create();
        $user = User::factory()->create();

        $participant = ChatParticipant::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'role' => 'member',
        ]);

        $this->assertEquals($conversation->id, $participant->conversation->id);
        $this->assertEquals($user->id, $participant->user->id);
    }

    public function test_field_trip_participant_model_relations(): void
    {
        $fieldTrip = FieldTrip::factory()->create();
        $student = Student::factory()->create(['national_id' => '1122334455']);

        $participant = FieldTripParticipant::create([
            'field_trip_id' => $fieldTrip->id,
            'national_id' => $student->national_id,
            'type' => 'student',
        ]);

        $this->assertEquals($fieldTrip->id, $participant->fieldTrip->id);
        $this->assertEquals($student->id, $participant->student->id);
    }
}
