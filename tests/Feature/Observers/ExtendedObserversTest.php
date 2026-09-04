<?php

namespace Tests\Feature\Observers;

use App\Events\DashboardStatsUpdated;
use App\Events\EmergencyReported;
use App\Jobs\SendWhatsAppTemplateJob;
use App\Models\Bus;
use App\Models\Incident;
use App\Models\School;
use App\Models\Student;
use App\Models\Trip;
use App\Models\TripAttendance;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class ExtendedObserversTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    public function test_trip_attendance_observer_dispatches_whatsapp_and_logs_event_on_boarded(): void
    {
        Queue::fake();

        $school = School::factory()->create();
        $driver = $this->createDriver();
        $bus = Bus::factory()->create(['school_id' => $school->id, 'driver_id' => $driver->id]);
        $trip = Trip::factory()->create(['school_id' => $school->id, 'bus_id' => $bus->id, 'driver_id' => $driver->id]);

        $parent = $this->createGuardian(['phone' => '771122334']);
        $student = Student::factory()->create(['first_name_ar' => 'محمد', 'last_name_ar' => 'أحمد']);
        $student->guardians()->attach($parent->id, ['relationship_type' => 'father']);

        $attendance = TripAttendance::create([
            'trip_id' => $trip->id,
            'student_id' => $student->id,
            'status' => 'pending',
        ]);

        // Status transition to boarded
        $attendance->update(['status' => 'boarded']);

        $this->assertDatabaseHas('system_event_logs', [
            'entity_type' => 'TripAttendance',
            'entity_id' => $attendance->id,
            'event_type' => 'student_status_transition',
        ]);

        Queue::assertPushed(SendWhatsAppTemplateJob::class, function ($job) {
            return $job->templateName === 'student_bus_status';
        });
    }

    public function test_incident_observer_invalidates_cache_and_broadcasts_emergency(): void
    {
        Event::fake([EmergencyReported::class]);
        Cache::put('global_active_emergencies_count', 5, 60);

        $school = School::factory()->create();
        $bus = Bus::factory()->create(['school_id' => $school->id]);

        $incident = Incident::factory()->create([
            'bus_id' => $bus->id,
            'status' => 'active',
        ]);

        $this->assertFalse(Cache::has('global_active_emergencies_count'));
        Event::assertDispatched(EmergencyReported::class);
    }

    public function test_bus_observer_clears_cache_and_broadcasts_stats(): void
    {
        Event::fake([DashboardStatsUpdated::class]);
        Cache::put('admin_dashboard_stats', ['test' => 1], 60);

        $school = School::factory()->create();
        $bus = Bus::factory()->create(['school_id' => $school->id]);

        $this->assertFalse(Cache::has('admin_dashboard_stats'));
        Event::assertDispatched(DashboardStatsUpdated::class);
    }

    public function test_user_observer_clears_cache_on_driver_update(): void
    {
        Cache::put('admin_dashboard_stats', ['total' => 10], 60);

        $driver = $this->createDriver();

        $this->assertFalse(Cache::has('admin_dashboard_stats'));
    }

    public function test_trip_attendance_observer_dispatches_english_whatsapp_template_for_english_guardian(): void
    {
        Queue::fake();

        $school = School::factory()->create(['name_en' => 'International School']);
        $driver = $this->createDriver();
        $bus = Bus::factory()->create(['school_id' => $school->id, 'driver_id' => $driver->id]);
        $trip = Trip::factory()->create(['school_id' => $school->id, 'bus_id' => $bus->id, 'driver_id' => $driver->id]);

        $parent = $this->createGuardian(['phone' => '771122334', 'preferred_language' => 'en']);
        $student = Student::factory()->create([
            'first_name_ar' => 'محمد',
            'last_name_ar' => 'أحمد',
            'first_name_en' => 'Mohammed',
            'last_name_en' => 'Ahmed',
        ]);
        $student->guardians()->attach($parent->id, ['relationship_type' => 'father']);

        $attendance = TripAttendance::create([
            'trip_id' => $trip->id,
            'student_id' => $student->id,
            'status' => 'pending',
            'waiting_start_time' => now()->subMinutes(3),
            'check_in_time' => now(),
        ]);

        // Status transition to boarded
        $attendance->update(['status' => 'boarded']);

        Queue::assertPushed(SendWhatsAppTemplateJob::class, function ($job) {
            return $job->templateName === 'student_bus_status_en'
                && in_array($job->lang, ['en', 'en_US'])
                && count($job->parameters) === 10
                && $job->parameters[1] === 'Mohammed Ahmed'
                && $job->parameters[3] === 'Boarded the bus ✅';
        });
    }

    public function test_trip_observer_dispatches_english_summary_for_english_school_admin(): void
    {
        Queue::fake();

        $school = School::factory()->create(['name' => 'المدرسة الدولية', 'name_en' => 'International School']);
        $schoolAdminUser = $this->createSchoolAdmin($school, ['phone' => '779988776', 'preferred_language' => 'en']);

        $bus = Bus::factory()->create(['school_id' => $school->id, 'bus_number' => 'B-505']);
        $trip = Trip::factory()->create([
            'school_id' => $school->id,
            'bus_id' => $bus->id,
            'status' => 'in_progress',
            'departure_time' => now()->subMinutes(45),
        ]);

        $trip->update([
            'status' => 'finished',
            'arrival_time' => now(),
        ]);

        Queue::assertPushed(SendWhatsAppTemplateJob::class, function ($job) {
            return $job->templateName === 'bus_trip_summary_en'
                && in_array($job->lang, ['en', 'en_US'])
                && count($job->parameters) === 11
                && $job->parameters[0] === 'International School'
                && $job->parameters[2] === 'B-505';
        });
    }
}
