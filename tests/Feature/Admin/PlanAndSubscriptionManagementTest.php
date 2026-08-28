<?php

namespace Tests\Feature\Admin;

use App\Models\Plan;
use App\Models\School;
use App\Models\Subscription;
use Tests\TestCase;
use Tests\Traits\CreatesUsers;

class PlanAndSubscriptionManagementTest extends TestCase
{
    use CreatesUsers;

    public function test_admin_can_view_plans_and_create_plan(): void
    {
        $admin = $this->createAdmin();

        $responseIndex = $this->actingAs($admin)->get('/admin/plans');
        $responseIndex->assertStatus(200);

        $responseStore = $this->actingAs($admin)->post('/admin/plans', [
            'name' => 'الباقة الشاملة الذكية',
            'description' => 'باقة متكاملة للمدارس الكبيرة',
            'price_per_student' => 90.00,
            'price_per_student_yearly' => 900.00,
            'max_buses' => 20,
            'is_active' => true,
        ]);

        $responseStore->assertRedirect();
        $this->assertDatabaseHas('plans', ['name' => 'الباقة الشاملة الذكية']);
    }

    public function test_admin_can_approve_school_subscription(): void
    {
        $admin = $this->createAdmin();
        $school = School::factory()->create(['is_active' => false]);
        $plan = Plan::factory()->create(['price_per_student' => 50.00]);

        $subscription = Subscription::factory()->create([
            'school_id' => $school->id,
            'plan_id' => $plan->id,
            'status' => 'pending_approval',
            'notes' => ['student_count' => 50],
        ]);

        $response = $this->actingAs($admin)->post("/admin/subscriptions/{$subscription->id}/approve", [
            'installments_count' => 2,
            'price_per_student' => 50.00,
        ]);

        $response->assertRedirect();
        $subscription->refresh();
        $this->assertEquals('active', $subscription->status);
    }

    public function test_admin_can_pause_and_resume_subscription(): void
    {
        $admin = $this->createAdmin();
        $school = School::factory()->create();
        $subscription = Subscription::factory()->create([
            'school_id' => $school->id,
            'status' => 'active',
        ]);

        $responsePause = $this->actingAs($admin)->post("/admin/subscriptions/{$subscription->id}/pause");
        $responsePause->assertRedirect();
        $subscription->refresh();
        $this->assertEquals('paused', $subscription->status);

        $responseResume = $this->actingAs($admin)->post("/admin/subscriptions/{$subscription->id}/resume");
        $responseResume->assertRedirect();
        $subscription->refresh();
        $this->assertEquals('active', $subscription->status);
    }
}
