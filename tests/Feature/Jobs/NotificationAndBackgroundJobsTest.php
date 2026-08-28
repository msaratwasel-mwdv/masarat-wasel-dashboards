<?php

namespace Tests\Feature\Jobs;

use App\Jobs\SendFcmNotification;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class NotificationAndBackgroundJobsTest extends TestCase
{
    public function test_send_fcm_notification_job_is_dispatchable_to_queue(): void
    {
        Queue::fake();

        SendFcmNotification::dispatch(
            ['sample_fcm_token_123'],
            'وصول الحافلة',
            'الحافلة على بعد دقيقتين من منزلك',
            ['trip_id' => '10']
        );

        Queue::assertPushed(SendFcmNotification::class, function ($job) {
            return true;
        });
    }

    public function test_send_fcm_notification_job_handles_gracefully(): void
    {
        $job = new SendFcmNotification(
            ['sample_fcm_token_456'],
            'تنبيه نظام النقل',
            'تم تسجيل صعود الطالب'
        );

        // Should execute handle without unhandled fatal exception
        $job->handle(app(\App\Services\NotificationService::class));
        $this->assertTrue(true);
    }
}
