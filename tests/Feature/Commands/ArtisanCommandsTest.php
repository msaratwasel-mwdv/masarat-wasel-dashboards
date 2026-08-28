<?php

namespace Tests\Feature\Commands;

use App\Models\Bus;
use App\Models\Installment;
use App\Models\Route;
use App\Models\School;
use App\Models\Subscription;
use App\Models\Trip;
use Carbon\Carbon;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class ArtisanCommandsTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    public function test_create_daily_trips_command_runs_successfully(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        Subscription::factory()->create(['school_id' => $school->id, 'status' => 'active']);

        \App\Models\AcademicCalendar::create([
            'school_id' => $school->id,
            'name' => 'الفصل الدراسي الأول',
            'is_active' => true,
            'start_date' => now()->subMonth()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
            'working_days' => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        ]);

        $driver = $this->createDriver();
        $route = Route::factory()->create(['school_id' => $school->id]);
        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
            'route_id' => $route->id,
            'status' => 'active',
        ]);

        $this->artisan('trips:create-daily')
            ->assertExitCode(0);

        $this->assertDatabaseHas('trips', [
            'school_id' => $school->id,
            'bus_id' => $bus->id,
        ]);
    }

    public function test_check_overdue_installments_command(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $subscription = Subscription::factory()->create(['school_id' => $school->id, 'status' => 'active']);

        $installment = Installment::factory()->create([
            'school_id' => $school->id,
            'subscription_id' => $subscription->id,
            'status' => 'pending',
            'due_date' => Carbon::yesterday()->toDateString(),
        ]);

        $this->artisan('installments:check-overdue')
            ->assertExitCode(0);

        $installment->refresh();
        $this->assertEquals('overdue', $installment->status);
    }

    public function test_auto_close_awaiting_video_trips_command(): void
    {
        $school = School::factory()->create(['is_active' => true]);
        $driver = $this->createDriver();
        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
        ]);

        $trip = Trip::factory()->create([
            'school_id' => $school->id,
            'bus_id' => $bus->id,
            'driver_id' => $driver->id,
            'status' => 'awaiting_video',
            'updated_at' => now()->subMinutes(45),
        ]);

        $this->artisan('trips:auto-close-awaiting-video')
            ->assertExitCode(0);

        $trip->refresh();
        $this->assertEquals('finished', $trip->status);
        $this->assertFalse((bool) $trip->video_check);
    }
}
