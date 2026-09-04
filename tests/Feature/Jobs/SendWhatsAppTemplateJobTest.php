<?php

namespace Tests\Feature\Jobs;

use App\Jobs\SendWhatsAppTemplateJob;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\Queue;
use Mockery;
use Tests\TestCase;

class SendWhatsAppTemplateJobTest extends TestCase
{
    public function test_send_whatsapp_template_job_can_be_queued(): void
    {
        Queue::fake();

        SendWhatsAppTemplateJob::dispatch(
            to: '771234567',
            templateName: 'student_bus_status',
            parameters: ['سارة', 'الحافلة 10'],
            lang: 'ar'
        );

        Queue::assertPushed(SendWhatsAppTemplateJob::class, function ($job) {
            return $job->to === '771234567'
                && $job->templateName === 'student_bus_status'
                && $job->parameters === ['سارة', 'الحافلة 10'];
        });
    }

    public function test_send_whatsapp_template_job_executes_successfully(): void
    {
        $whatsAppServiceMock = Mockery::mock(WhatsAppService::class);
        $whatsAppServiceMock->shouldReceive('sendTemplate')
            ->once()
            ->with(
                '771234567',
                'student_bus_status',
                ['سارة', 'الحافلة 10'],
                'ar',
                null,
                null,
                null
            )
            ->andReturn(true);

        $this->app->instance(WhatsAppService::class, $whatsAppServiceMock);

        $job = new SendWhatsAppTemplateJob(
            to: '771234567',
            templateName: 'student_bus_status',
            parameters: ['سارة', 'الحافلة 10'],
            lang: 'ar'
        );

        $job->handle($whatsAppServiceMock);
        $this->assertTrue(true);
    }
}
