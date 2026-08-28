<?php

namespace Tests\Unit\Services;

use App\Mail\SchoolSubscriptionApproved;
use App\Models\Classroom;
use App\Models\Grade;
use App\Models\Installment;
use App\Models\Plan;
use App\Models\School;
use App\Models\Student;
use App\Models\Subscription;
use App\Services\SubscriptionService;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesUsers;

class SubscriptionServiceTest extends TestCase
{
    use CreatesSchoolData, CreatesUsers;

    protected SubscriptionService $subscriptionService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->subscriptionService = new SubscriptionService;
    }

    public function test_assign_plan_to_school_creates_pending_subscription(): void
    {
        $school = School::factory()->create();
        $plan = Plan::factory()->create();

        $result = $this->subscriptionService->assignPlanToSchool($school->id, $plan->id);

        $this->assertNotNull($result['subscription']);
        $this->assertEquals('pending_approval', $result['subscription']->status);
        $this->assertDatabaseHas('subscriptions', [
            'school_id' => $school->id,
            'plan_id' => $plan->id,
            'status' => 'pending_approval',
        ]);
    }

    public function test_approve_subscription_activates_school_and_creates_installments(): void
    {
        Mail::fake();

        $school = School::factory()->create(['is_active' => false]);
        $schoolAdmin = $this->createSchoolAdmin($school);
        $plan = Plan::factory()->create(['price_per_student' => 50.00]);

        $subscription = Subscription::factory()->create([
            'school_id' => $school->id,
            'plan_id' => $plan->id,
            'status' => 'pending_approval',
            'notes' => ['student_count' => 100],
        ]);

        $result = $this->subscriptionService->approveSubscription(
            subscriptionId: $subscription->id,
            installmentsCount: 4,
            pricePerStudent: 50.00
        );

        $subscription->refresh();
        $school->refresh();

        $this->assertEquals('active', $subscription->status);
        $this->assertTrue((bool) $school->is_active);
        $this->assertEquals(5000.00, $subscription->final_price); // 100 * 50

        // Check installments creation (4 installments of 1250 each)
        $installments = Installment::where('subscription_id', $subscription->id)->get();
        $this->assertCount(4, $installments);
        $this->assertEquals(1250.00, $installments->first()->amount);

        Mail::assertSent(SchoolSubscriptionApproved::class);
    }

    public function test_recalculate_pending_installments_when_students_increase(): void
    {
        $school = School::factory()->create();
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);
        $plan = Plan::factory()->create();

        $subscription = Subscription::factory()->create([
            'school_id' => $school->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'final_price' => 1000.00,
            'notes' => ['approved_price_per_student' => 100.00],
        ]);

        // 2 pending installments of 500 each
        Installment::factory()->create([
            'school_id' => $school->id,
            'subscription_id' => $subscription->id,
            'amount' => 500.00,
            'status' => 'pending',
            'installment_number' => 1,
        ]);
        Installment::factory()->create([
            'school_id' => $school->id,
            'subscription_id' => $subscription->id,
            'amount' => 500.00,
            'status' => 'pending',
            'installment_number' => 2,
        ]);

        // Enroll 20 students (Total should become 20 * 100 = 2000.00, so diff = +1000.00)
        for ($i = 0; $i < 20; $i++) {
            Student::factory()->enrolled($school, $classroom)->create();
        }

        $this->subscriptionService->recalculatePendingInstallments($school->id);

        $subscription->refresh();
        $this->assertEquals(2000.00, $subscription->final_price);

        // Each pending installment should be increased by 500 (+1000 / 2) = 1000.00 each
        $installments = Installment::where('subscription_id', $subscription->id)->get();
        $this->assertEquals(1000.00, $installments->first()->amount);
        $this->assertEquals(1000.00, $installments->last()->amount);
    }
}
