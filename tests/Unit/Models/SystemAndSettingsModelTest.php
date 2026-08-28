<?php

namespace Tests\Unit\Models;

use App\Models\Event;
use App\Models\LoginAttempt;
use App\Models\SystemEventLog;
use App\Models\User;
use Tests\TestCase;

class SystemAndSettingsModelTest extends TestCase
{
    public function test_system_event_log_model(): void
    {
        $user = User::factory()->create();

        $eventLog = SystemEventLog::create([
            'event_type' => 'student_enrolled',
            'entity_type' => 'Student',
            'entity_id' => 10,
            'user_id' => $user->id,
            'role' => 'school_admin',
            'before_data' => null,
            'after_data' => ['classroom_id' => 2],
        ]);

        $this->assertDatabaseHas('system_event_logs', ['id' => $eventLog->id]);
        $this->assertIsArray($eventLog->after_data);
    }

    public function test_login_attempt_and_event_models(): void
    {
        $user = User::factory()->create();

        $attempt = LoginAttempt::create([
            'user_id' => $user->id,
            'device_name' => 'iPhone 15 Pro',
            'device_id' => 'DEV-9988',
            'device_type' => 'ios',
            'app_context' => 'parent_app',
            'status' => 'pending',
            'temp_token' => 'TMP-12345',
        ]);

        $this->assertEquals($user->id, $attempt->user->id);
        $this->assertEquals('pending', $attempt->status);

        $event = Event::factory()->create([
            'title_ar' => 'بداية العام الدراسي الجديد',
            'is_published' => true,
        ]);

        $this->assertDatabaseHas('events', ['id' => $event->id]);
        $this->assertTrue($event->is_published);
    }
}
