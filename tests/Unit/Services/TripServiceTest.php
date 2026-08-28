<?php

namespace Tests\Unit\Services;

use App\Models\AbsenceRequest;
use App\Models\AcademicCalendar;
use App\Models\Bus;
use App\Models\Holiday;
use App\Models\Route;
use App\Models\School;
use App\Models\Student;
use App\Models\Trip;
use App\Models\TripAttendance;
use App\Services\NotificationService;
use App\Services\TripService;
use Carbon\Carbon;
use Mockery;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class TripServiceTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    protected TripService $tripService;

    protected $notificationServiceMock;

    protected function setUp(): void
    {
        parent::setUp();

        $this->notificationServiceMock = Mockery::mock(NotificationService::class);
        $this->app->instance(NotificationService::class, $this->notificationServiceMock);

        $this->tripService = new TripService($this->notificationServiceMock);
    }

    public function test_validate_target_date_reports_no_schools_when_empty(): void
    {
        $result = $this->tripService->validateTargetDate(Carbon::now());

        $this->assertEquals('no_schools', $result['status']);
        $this->assertFalse($result['is_working']);
    }

    public function test_validate_target_date_with_active_calendar_and_holiday(): void
    {
        $school = School::factory()->create();

        // 1. No active calendar
        $result = $this->tripService->validateTargetDate(Carbon::parse('2026-09-01')); // Tuesday
        $this->assertEquals('skipped', $result['status']);
        $this->assertFalse($result['is_working']);

        // 2. Active calendar on a working day
        $calendar = AcademicCalendar::create([
            'school_id' => $school->id,
            'name' => 'الفصل الأول',
            'start_date' => '2026-08-01',
            'end_date' => '2026-12-31',
            'working_days' => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
            'is_active' => true,
        ]);

        $workingDayResult = $this->tripService->validateTargetDate(Carbon::parse('2026-09-01')); // Tuesday
        $this->assertEquals('working', $workingDayResult['status']);
        $this->assertTrue($workingDayResult['is_working']);

        // 3. Off-day (Friday)
        $offDayResult = $this->tripService->validateTargetDate(Carbon::parse('2026-09-04')); // Friday
        $this->assertEquals('skipped', $offDayResult['status']);
        $this->assertFalse($offDayResult['is_working']);

        // 4. Official Holiday (Global)
        Holiday::create([
            'school_id' => null,
            'name' => 'عطلة رسمية',
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-01 23:59:59',
            'type' => 'official',
        ]);

        $holidayResult = $this->tripService->validateTargetDate(Carbon::parse('2026-09-01'));
        $this->assertEquals('skipped', $holidayResult['status']);
        $this->assertFalse($holidayResult['is_working']);
    }

    public function test_create_daily_trip_and_generates_student_attendances(): void
    {
        $school = School::factory()->create();
        $driver = $this->createDriver();
        $route = Route::factory()->create(['school_id' => $school->id]);

        $bus = Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
            'route_id' => $route->id,
        ]);

        $student1 = Student::factory()->create([
            'forth_bus_id' => $bus->id,
            'is_active' => true,
        ]);

        $student2 = Student::factory()->create([
            'forth_bus_id' => $bus->id,
            'is_active' => true,
        ]);

        $date = Carbon::parse('2026-09-01');

        // Approved absence for student2
        AbsenceRequest::factory()->create([
            'student_id' => $student2->id,
            'date' => $date->toDateString(),
            'type' => 'full_day',
            'status' => 'approved',
        ]);

        [$trip, $reason] = $this->tripService->createDailyTrip($bus, 'forth', $date);

        $this->assertNotNull($trip);
        $this->assertEquals('created', $reason);
        $this->assertDatabaseHas('trips', ['id' => $trip->id, 'bus_id' => $bus->id, 'type' => 'forth']);

        $attendances = TripAttendance::where('trip_id', $trip->id)->get();
        $this->assertCount(2, $attendances);

        $att1 = $attendances->where('student_id', $student1->id)->first();
        $att2 = $attendances->where('student_id', $student2->id)->first();

        $this->assertEquals('pending', $att1->status);
        $this->assertEquals('excused', $att2->status); // Excused due to approved absence
    }

    public function test_mark_attendance_triggers_notifications(): void
    {
        $trip = Trip::factory()->create(['type' => 'forth']);
        $student = Student::factory()->create(['first_name_ar' => 'فهد', 'last_name_ar' => 'العتيبي']);

        $attendance = TripAttendance::factory()->create([
            'trip_id' => $trip->id,
            'student_id' => $student->id,
            'status' => 'pending',
        ]);

        // Expect notification for boarding
        $this->notificationServiceMock
            ->shouldReceive('notifyStudentGuardian')
            ->once()
            ->withArgs(function ($studentId, $type, $title) use ($student) {
                return $studentId === $student->id && $type === 'bus_boarding';
            });

        $this->tripService->markAttendance($trip->id, $student->id, 'boarded');

        $attendance->refresh();
        $this->assertEquals('boarded', $attendance->status);
        $this->assertNotNull($attendance->check_in_time);
    }
}
