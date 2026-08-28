<?php

namespace Tests\Feature\E2E;

use App\Models\Bus;
use App\Models\Classroom;
use App\Models\Grade;
use App\Models\Plan;
use App\Models\Route;
use App\Models\School;
use App\Models\Student;
use App\Models\Trip;
use App\Services\SubscriptionService;
use App\Services\TripService;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class FullTransportationCycleTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    public function test_complete_school_transportation_lifecycle_e2e(): void
    {
        // ═══════════════════════════════════════════════════════════════
        // الخطوة 1: مدير النظام ينشئ باقة ويعتمد اشتراك المدرسة مع الأقساط
        // ═══════════════════════════════════════════════════════════════
        $admin = $this->createAdmin();
        $school = School::factory()->create(['is_active' => true]);
        $plan = Plan::factory()->create([
            'price_per_student' => 100.00,
            'price_per_student_yearly' => 1000.00,
            'is_active' => true,
        ]);

        $subscriptionService = app(SubscriptionService::class);
        $result = $subscriptionService->assignPlanToSchool($school->id, $plan->id);
        $subscription = $result['subscription'];
        $subscription->update(['notes' => ['student_count' => 50]]);

        $this->assertEquals('pending_approval', $subscription->status);

        // اعتماد الاشتراك
        $this->actingAs($admin)->post("/admin/subscriptions/{$subscription->id}/approve", [
            'installments_count' => 2,
            'price_per_student' => 100.00,
        ]);
        $subscription->refresh();
        $this->assertEquals('active', $subscription->status);

        // ═══════════════════════════════════════════════════════════════
        // الخطوة 2: تهيئة المدرسة (المراحل، الفصول، الطاقم، الباص، والمسار)
        // ═══════════════════════════════════════════════════════════════
        $schoolAdmin = $this->createSchoolAdmin($school);
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);

        \App\Models\AcademicCalendar::create([
            'school_id' => $school->id,
            'name' => 'الفصل الدراسي الأول',
            'is_active' => true,
            'start_date' => now()->subMonth()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
            'working_days' => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        ]);

        $route = Route::factory()->create(['school_id' => $school->id]);
        $driver = $this->createDriver();
        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
            'route_id' => $route->id,
            'status' => 'active',
        ]);

        // ═══════════════════════════════════════════════════════════════
        // الخطوة 3: تسجيل الطالب وتعيين مسار الحافلة
        // ═══════════════════════════════════════════════════════════════
        $student = Student::factory()->enrolled($school, $classroom)->create([
            'forth_bus_id' => $bus->id,
            'back_bus_id' => $bus->id,
            'is_active' => true,
        ]);

        $parent = $this->createGuardian();
        $student->guardians()->attach($parent->id, ['relationship_type' => 'father']);

        // ═══════════════════════════════════════════════════════════════
        // الخطوة 4: التوليد الآلي للرحلات اليومية
        // ═══════════════════════════════════════════════════════════════
        $tripService = app(TripService::class);
        $tripsResult = $tripService->autoCreateDailyTrips(Carbon::today());
        $this->assertGreaterThanOrEqual(1, $tripsResult['created']);

        $trip = Trip::where('bus_id', $bus->id)
            ->whereDate('trip_date', Carbon::today())
            ->where('type', 'forth')
            ->first();

        $this->assertNotNull($trip);

        // ═══════════════════════════════════════════════════════════════
        // الخطوة 5: السائق يبدأ الرحلة عبر تطبيق الجوال (API)
        // ═══════════════════════════════════════════════════════════════
        Sanctum::actingAs($driver, ['*']);

        // 1. استعراض رحلات اليوم
        $responseTrips = $this->getJson('/api/driver/my-trips');
        $responseTrips->assertStatus(200);

        // 2. بدء الرحلة -> بانتظار التأكيد
        $responseStart = $this->postJson("/api/bus/{$bus->id}/start-trip", [
            'latitude' => 24.7136,
            'longitude' => 46.6753,
        ]);
        $responseStart->assertSuccessful();

        // 3. تأكيد الرحلة -> قيد التنفيذ
        $responseConfirm = $this->postJson("/api/bus/{$bus->id}/confirm-trip", [
            'trip_id' => $trip->id,
        ]);
        $responseConfirm->assertSuccessful();

        $trip->refresh();
        $this->assertEquals('in_progress', $trip->status);

        // ═══════════════════════════════════════════════════════════════
        // الخطوة 6: صعود الطالب ونزوله
        // ═══════════════════════════════════════════════════════════════
        // صعود الطالب
        $responseBoard = $this->postJson("/api/bus/{$bus->id}/mark-boarded", [
            'trip_id' => $trip->id,
            'student_id' => $student->id,
        ]);
        $responseBoard->assertSuccessful();

        $this->assertDatabaseHas('trip_attendances', [
            'trip_id' => $trip->id,
            'student_id' => $student->id,
            'status' => 'boarded',
        ]);

        // نزول الطالب في المدرسة
        $responseDrop = $this->postJson("/api/bus/{$bus->id}/mark-dropped", [
            'trip_id' => $trip->id,
            'student_id' => $student->id,
        ]);
        $responseDrop->assertSuccessful();

        $this->assertDatabaseHas('trip_attendances', [
            'trip_id' => $trip->id,
            'student_id' => $student->id,
            'status' => 'dropped',
        ]);

        // ═══════════════════════════════════════════════════════════════
        // الخطوة 7: وصول الحافلة وإنهاء الرحلة
        // ═══════════════════════════════════════════════════════════════
        $responseArrive = $this->postJson("/api/bus/{$bus->id}/arrive");
        $responseArrive->assertSuccessful();

        $trip->refresh();
        $this->assertEquals('awaiting_video', $trip->status);

        // ═══════════════════════════════════════════════════════════════
        // الخطوة 8: سداد القسط المالي وتحديث حالة الدفع
        // ═══════════════════════════════════════════════════════════════
        $installment = $subscription->installments()->first();
        $this->assertNotNull($installment);

        $this->actingAs($admin)->post("/admin/installments/{$installment->id}/pay", [
            'amount' => $installment->amount,
            'payment_method' => 'bank_transfer',
            'reference_number' => 'TXN-987654321',
        ]);

        $installment->refresh();
        $this->assertEquals('paid', $installment->status);
    }
}
