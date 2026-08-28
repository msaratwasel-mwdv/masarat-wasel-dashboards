<?php

namespace Tests\Unit;

use App\Models\AbsenceRequest;
use App\Models\Attendance;
use App\Models\Bus;
use App\Models\BusExpense;
use App\Models\BusRequest;
use App\Models\Classroom;
use App\Models\Conversation;
use App\Models\Event;
use App\Models\FieldTrip;
use App\Models\Grade;
use App\Models\Incident;
use App\Models\Inspection;
use App\Models\InspectionItem;
use App\Models\Installment;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Plan;
use App\Models\Route;
use App\Models\School;
use App\Models\Student;
use App\Models\Subscription;
use App\Models\Trip;
use App\Models\TripAttendance;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class InfrastructureSanityTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    public function test_can_create_users_with_different_roles(): void
    {
        $admin = $this->createAdmin();
        $this->assertTrue($admin->hasRole('admin'));

        $school = School::factory()->create();
        $schoolAdmin = $this->createSchoolAdmin($school);
        $this->assertTrue($schoolAdmin->hasRole('school_admin'));
        $this->assertEquals($school->id, $schoolAdmin->getSchoolId());

        $driver = $this->createDriver();
        $this->assertTrue($driver->hasRole('driver'));
        $this->assertNotNull($driver->driver);

        $assistant = $this->createAssistant();
        $this->assertTrue($assistant->hasRole('assistant'));
        $this->assertNotNull($assistant->assistant);

        $fieldSupervisor = $this->createFieldSupervisor();
        $this->assertTrue($fieldSupervisor->hasRole('field_supervisor'));
        $this->assertNotNull($fieldSupervisor->fieldSupervisor);

        $teacher = $this->createTeacher($school);
        $this->assertTrue($teacher->hasRole('teacher'));
        $this->assertNotNull($teacher->teacher);

        $guardian = $this->createGuardian();
        $this->assertTrue($guardian->hasRole('parent'));
        $this->assertNotNull($guardian->guardian);
    }

    public function test_can_create_all_core_models_via_factories(): void
    {
        $school = School::factory()->create();
        $this->assertDatabaseHas('schools', ['id' => $school->id]);

        $plan = Plan::factory()->create();
        $this->assertDatabaseHas('plans', ['id' => $plan->id]);

        $subscription = Subscription::factory()->create([
            'school_id' => $school->id,
            'plan_id' => $plan->id,
        ]);
        $this->assertDatabaseHas('subscriptions', ['id' => $subscription->id]);

        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);
        $this->assertDatabaseHas('classrooms', ['id' => $classroom->id]);

        $route = Route::factory()->create(['school_id' => $school->id]);
        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'route_id' => $route->id,
        ]);
        $this->assertDatabaseHas('buses', ['id' => $bus->id]);

        $student = Student::factory()->enrolled($school, $classroom)->create();
        $this->assertDatabaseHas('students', ['id' => $student->id]);
        $this->assertDatabaseHas('student_school_enrollments', [
            'student_id' => $student->id,
            'classroom_id' => $classroom->id,
        ]);

        $trip = Trip::factory()->create([
            'bus_id' => $bus->id,
            'school_id' => $school->id,
        ]);
        $this->assertDatabaseHas('trips', ['id' => $trip->id]);

        $tripAttendance = TripAttendance::factory()->create([
            'trip_id' => $trip->id,
            'student_id' => $student->id,
        ]);
        $this->assertDatabaseHas('trip_attendances', ['id' => $tripAttendance->id]);

        $attendance = Attendance::factory()->create([
            'student_id' => $student->id,
            'classroom_id' => $classroom->id,
        ]);
        $this->assertDatabaseHas('attendances', ['id' => $attendance->id]);

        $event = Event::factory()->create();
        $this->assertDatabaseHas('events', ['id' => $event->id]);

        $notification = Notification::factory()->create();
        $this->assertDatabaseHas('notifications', ['id' => $notification->id]);

        $conversation = Conversation::factory()->create(['school_id' => $school->id]);
        $this->assertDatabaseHas('conversations', ['id' => $conversation->id]);

        $message = Message::factory()->create(['conversation_id' => $conversation->id]);
        $this->assertDatabaseHas('messages', ['id' => $message->id]);

        $busExpense = BusExpense::factory()->create(['bus_id' => $bus->id]);
        $this->assertDatabaseHas('bus_expenses', ['id' => $busExpense->id]);

        $busRequest = BusRequest::factory()->create(['school_id' => $school->id]);
        $this->assertDatabaseHas('bus_requests', ['id' => $busRequest->id]);

        $fieldTrip = FieldTrip::factory()->create(['school_id' => $school->id, 'bus_id' => $bus->id]);
        $this->assertDatabaseHas('field_trips', ['id' => $fieldTrip->id]);

        $incident = Incident::factory()->create(['bus_id' => $bus->id]);
        $this->assertDatabaseHas('incidents', ['id' => $incident->id]);

        $inspection = Inspection::factory()->create(['bus_id' => $bus->id]);
        $this->assertDatabaseHas('inspections', ['id' => $inspection->id]);

        $inspectionItem = InspectionItem::factory()->create();
        $this->assertDatabaseHas('inspection_items', ['id' => $inspectionItem->id]);

        $absenceRequest = AbsenceRequest::factory()->create(['student_id' => $student->id]);
        $this->assertDatabaseHas('absence_requests', ['id' => $absenceRequest->id]);

        $installment = Installment::factory()->create([
            'school_id' => $school->id,
            'subscription_id' => $subscription->id,
        ]);
        $this->assertDatabaseHas('installments', ['id' => $installment->id]);

        $setting = \App\Models\SystemSetting::factory()->create();
        $this->assertDatabaseHas('system_settings', ['id' => $setting->id]);

        $whatsAppLog = \App\Models\WhatsAppLog::factory()->create();
        $this->assertDatabaseHas('whatsapp_logs', ['id' => $whatsAppLog->id]);
    }

    public function test_helpers_generate_complete_structures(): void
    {
        $fleet = $this->createTransportFleet();
        $this->assertNotNull($fleet['bus']);
        $this->assertNotNull($fleet['driver']);
        $this->assertNotNull($fleet['assistant']);
        $this->assertNotNull($fleet['route']);

        $schoolSetup = $this->createCompleteSchool();
        $this->assertNotNull($schoolSetup['school']);
        $this->assertNotNull($schoolSetup['admin']);
        $this->assertNotNull($schoolSetup['grade']);
        $this->assertNotNull($schoolSetup['classroom']);
    }
}
