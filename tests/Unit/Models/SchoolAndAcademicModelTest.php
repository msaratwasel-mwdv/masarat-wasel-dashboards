<?php

namespace Tests\Unit\Models;

use App\Models\AcademicCalendar;
use App\Models\Bus;
use App\Models\Classroom;
use App\Models\Grade;
use App\Models\Holiday;
use App\Models\Route;
use App\Models\School;
use App\Models\Subscription;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;

class SchoolAndAcademicModelTest extends TestCase
{
    use CreatesSchoolData;

    public function test_school_relationships(): void
    {
        $school = School::factory()->create();
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id]);
        $bus = Bus::factory()->create(['school_id' => $school->id]);
        $route = Route::factory()->create(['school_id' => $school->id]);
        $subscription = Subscription::factory()->create(['school_id' => $school->id]);

        $this->assertTrue($school->classrooms->contains('id', $classroom->id));
        $this->assertTrue($school->buses->contains('id', $bus->id));
        $this->assertEquals($school->id, $route->school->id);
        $this->assertTrue($school->subscriptions->contains('id', $subscription->id));
    }

    public function test_grade_and_classroom_hierarchy(): void
    {
        $school = School::factory()->create();
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'الصف الأول']);
        $classroom = Classroom::factory()->create(['grade_id' => $grade->id, 'name' => 'فصل 1/أ']);

        $this->assertEquals($school->id, $grade->school->id);
        $this->assertEquals($grade->id, $classroom->grade->id);
        $this->assertEquals($school->id, $classroom->school->id);
        $this->assertTrue($grade->classrooms->contains('id', $classroom->id));
    }

    public function test_classroom_at_school_scope(): void
    {
        $school1 = School::factory()->create();
        $grade1 = Grade::factory()->create(['school_id' => $school1->id]);
        $class1 = Classroom::factory()->create(['grade_id' => $grade1->id]);

        $school2 = School::factory()->create();
        $grade2 = Grade::factory()->create(['school_id' => $school2->id]);
        $class2 = Classroom::factory()->create(['grade_id' => $grade2->id]);

        $school1Classes = Classroom::atSchool($school1->id)->get();

        $this->assertTrue($school1Classes->contains('id', $class1->id));
        $this->assertFalse($school1Classes->contains('id', $class2->id));
    }

    public function test_academic_calendar_and_holiday_relations(): void
    {
        $school = School::factory()->create();
        $calendar = AcademicCalendar::create([
            'school_id' => $school->id,
            'name' => 'الفصل الدراسي الأول',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(4)->toDateString(),
            'working_days' => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
            'is_active' => true,
        ]);

        $holiday = Holiday::create([
            'school_id' => $school->id,
            'name' => 'اليوم الوطني',
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(11)->toDateString(),
            'type' => 'official',
        ]);

        $this->assertEquals($school->id, $calendar->school->id);
        $this->assertEquals($school->id, $holiday->school->id);
    }
}
