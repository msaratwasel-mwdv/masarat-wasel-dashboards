<?php

namespace Tests\Unit\Models;

use App\Models\Bus;
use App\Models\BusRequest;
use App\Models\FieldTrip;
use App\Models\Incident;
use App\Models\Inspection;
use App\Models\InspectionItem;
use App\Models\InspectionResult;
use App\Models\School;
use App\Models\Violation;
use Tests\TestCase;
use Tests\Traits\CreatesUsers;

class SafetyAndFieldModelTest extends TestCase
{
    use CreatesUsers;

    public function test_incident_reporting_relationships_and_accessors(): void
    {
        $reporter = $this->createDriver();
        $resolver = $this->createAdmin();
        $bus = Bus::factory()->create();

        $incident = Incident::factory()->create([
            'reporter_id' => $reporter->id,
            'bus_id' => $bus->id,
            'resolved_by' => $resolver->id,
            'type' => 'mechanical',
            'severity' => 'high',
            'status' => 'resolved',
        ]);

        $this->assertEquals($reporter->id, $incident->reporter->id);
        $this->assertEquals($bus->id, $incident->bus->id);
        $this->assertEquals($resolver->id, $incident->resolver->id);
        $this->assertIsArray($incident->photo_urls);
        $this->assertIsArray($incident->student_names);
    }

    public function test_field_inspection_and_results_system(): void
    {
        $supervisor = $this->createFieldSupervisor();
        $bus = Bus::factory()->create();

        $inspection = Inspection::factory()->create([
            'field_supervisor_id' => $supervisor->id,
            'bus_id' => $bus->id,
            'overall_status' => 'pass',
        ]);

        $item = InspectionItem::factory()->create(['name' => 'فحص الفرامل']);

        $result = InspectionResult::create([
            'inspection_id' => $inspection->id,
            'inspection_item_id' => $item->id,
            'is_passed' => true,
            'notes' => 'ممتازة',
        ]);

        $this->assertEquals($supervisor->id, $inspection->fieldSupervisor->id);
        $this->assertEquals($bus->id, $inspection->bus->id);
        $this->assertTrue($inspection->results->contains('id', $result->id));
        $this->assertEquals($item->id, $result->item->id);
    }

    public function test_violation_model_relationships(): void
    {
        $supervisor = $this->createFieldSupervisor();
        $bus = Bus::factory()->create();

        $violation = Violation::create([
            'field_supervisor_id' => $supervisor->id,
            'bus_id' => $bus->id,
            'type' => 'speeding',
            'description' => 'تجاوز السرعة المحددة',
            'status' => 'pending',
        ]);

        $this->assertEquals($supervisor->id, $violation->fieldSupervisor->id);
        $this->assertEquals($bus->id, $violation->bus->id);
    }

    public function test_field_trip_and_bus_request_models(): void
    {
        $school = School::factory()->create();
        $bus = Bus::factory()->create(['school_id' => $school->id]);

        $fieldTrip = FieldTrip::factory()->create([
            'school_id' => $school->id,
            'bus_id' => $bus->id,
            'status' => 'in_progress',
        ]);

        $this->assertEquals($school->id, $fieldTrip->school->id);
        $this->assertEquals($bus->id, $fieldTrip->bus->id);
        $this->assertTrue($fieldTrip->isInProgress());

        $busRequest = BusRequest::factory()->approved()->create([
            'school_id' => $school->id,
        ]);

        $this->assertTrue($busRequest->isApproved());
        $this->assertFalse($busRequest->isPending());
    }
}
