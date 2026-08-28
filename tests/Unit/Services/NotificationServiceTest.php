<?php

namespace Tests\Unit\Services;

use App\Models\Student;
use App\Models\User;
use App\Services\NotificationService;
use Tests\TestCase;
use Tests\Traits\CreatesUsers;

class NotificationServiceTest extends TestCase
{
    use CreatesUsers;

    protected NotificationService $notificationService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->notificationService = new NotificationService;
    }

    public function test_send_to_user_creates_database_notification(): void
    {
        $user = User::factory()->create();

        $notification = $this->notificationService->sendToUser(
            userId: $user->id,
            type: 'general_alert',
            title: 'تنبيه هام',
            message: 'نحيطكم علماً بتقديم موعد الرحلة',
            data: ['trip_id' => '10'],
            titleEn: 'Important Alert',
            messageEn: 'Please note the earlier departure time'
        );

        $this->assertDatabaseHas('notifications', [
            'id' => $notification->id,
            'user_id' => $user->id,
            'type' => 'general_alert',
            'title' => 'تنبيه هام',
            'title_en' => 'Important Alert',
            'status' => 'unread',
        ]);
    }

    public function test_notify_student_guardian_finds_and_notifies_linked_guardians(): void
    {
        $student = Student::factory()->create();
        $guardian = $this->createGuardian();

        $student->guardians()->attach($guardian->id, ['relationship_type' => 'father']);

        $this->notificationService->notifyStudentGuardian(
            studentId: $student->id,
            type: 'bus_boarding',
            title: '🚌 ركب الحافلة',
            message: 'ركب الطالب الحافلة بأمان'
        );

        $this->assertDatabaseHas('notifications', [
            'user_id' => $guardian->id,
            'type' => 'bus_boarding',
            'title' => '🚌 ركب الحافلة',
        ]);
    }
}
