<?php

namespace Tests\Feature\Api;

use App\Models\Student;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Tests\Traits\CreatesUsers;

class ParentApiControllerTest extends TestCase
{
    use CreatesUsers;

    public function test_parent_can_fetch_profile_and_children(): void
    {
        $parent = $this->createGuardian();
        $student = Student::factory()->create();
        $student->guardians()->attach($parent->id, ['relationship_type' => 'father']);

        Sanctum::actingAs($parent, ['*']);

        $responseProfile = $this->getJson('/api/parent/profile');
        $responseProfile->assertStatus(200);

        $responseChildren = $this->getJson('/api/parent/children');
        $responseChildren->assertStatus(200);
    }

    public function test_parent_can_submit_absence_request(): void
    {
        $parent = $this->createGuardian();
        $student = Student::factory()->create();
        $student->guardians()->attach($parent->id, ['relationship_type' => 'mother']);

        Sanctum::actingAs($parent, ['*']);

        $response = $this->postJson('/api/parent/absence-requests', [
            'student_id' => $student->id,
            'date' => now()->addDay()->toDateString(),
            'type' => 'full_day',
            'reason' => 'ظرف عائلي طارئ',
        ]);

        $response->assertSuccessful();
        $this->assertDatabaseHas('absence_requests', [
            'student_id' => $student->id,
            'guardian_id' => $parent->id,
            'reason' => 'ظرف عائلي طارئ',
        ]);
    }
}
