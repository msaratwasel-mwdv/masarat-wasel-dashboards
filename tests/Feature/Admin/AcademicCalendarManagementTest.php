<?php

namespace Tests\Feature\Admin;

use App\Models\AcademicCalendar;
use App\Models\School;
use App\Services\NotificationService;
use Mockery;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class AcademicCalendarManagementTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    public function test_admin_can_view_academic_calendars_index(): void
    {
        $admin = $this->createAdmin();
        $school = School::factory()->create();

        AcademicCalendar::create([
            'school_id' => $school->id,
            'name' => 'الفصل الدراسي الأول',
            'start_date' => '2026-09-01',
            'end_date' => '2026-12-31',
            'working_days' => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->get(route('admin.academic-calendars.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/AcademicCalendars/Index')
            ->has('calendars', 1)
            ->has('schools')
        );
    }

    public function test_admin_can_create_academic_calendar_and_prevent_overlap(): void
    {
        $admin = $this->createAdmin();
        $school = School::factory()->create();

        $response = $this->actingAs($admin)->post(route('admin.academic-calendars.store'), [
            'school_id' => $school->id,
            'name' => 'الفصل الأول 2026',
            'start_date' => '2026-09-01',
            'end_date' => '2026-12-31',
            'working_days' => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
            'is_active' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('academic_calendars', [
            'school_id' => $school->id,
            'name' => 'الفصل الأول 2026',
            'is_active' => 1,
        ]);

        // Attempt overlapping calendar for same school
        $overlapResponse = $this->actingAs($admin)->post(route('admin.academic-calendars.store'), [
            'school_id' => $school->id,
            'name' => 'تقويم متداخل',
            'start_date' => '2026-10-01',
            'end_date' => '2026-11-30',
            'working_days' => ['sunday', 'monday'],
        ]);

        $overlapResponse->assertSessionHasErrors(['start_date']);
    }

    public function test_admin_can_view_and_create_holidays(): void
    {
        $notificationMock = Mockery::mock(NotificationService::class);
        $notificationMock->shouldReceive('sendToUser')->andReturn(null);
        $this->app->instance(NotificationService::class, $notificationMock);

        $admin = $this->createAdmin();
        $school = School::factory()->create();

        $response = $this->actingAs($admin)->get(route('admin.holidays.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Holidays/Index')
            ->has('holidays')
            ->has('schools')
        );

        $storeResponse = $this->actingAs($admin)->post(route('admin.holidays.store'), [
            'school_id' => $school->id,
            'name' => 'عطلة رسمية وطنية',
            'start_date' => '2026-10-14',
            'end_date' => '2026-10-14',
            'type' => 'official',
            'notes' => 'عطلة رسمية معتمدة',
        ]);

        $storeResponse->assertRedirect();
        $this->assertDatabaseHas('holidays', [
            'name' => 'عطلة رسمية وطنية',
            'school_id' => $school->id,
            'type' => 'official',
        ]);
    }
}
