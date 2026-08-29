<?php

namespace App\Jobs;

use App\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendWhatsAppTemplateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public array $backoff = [5, 20, 60];

    /**
     * The maximum number of unhandled exceptions to allow before failing.
     */
    public int $maxExceptions = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 30;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $to,
        public string $templateName,
        public array $parameters = [],
        public string $lang = 'ar',
        public ?string $headerImageUrl = null,
        public ?string $eventType = null,
        public ?int $userId = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(WhatsAppService $whatsAppService): void
    {
        Log::info("Processing SendWhatsAppTemplateJob for {$this->to} (Template: {$this->templateName})");

        $sent = $whatsAppService->sendTemplate(
            to: $this->to,
            templateName: $this->templateName,
            parameters: $this->parameters,
            lang: $this->lang,
            headerImageUrl: $this->headerImageUrl,
            eventType: $this->eventType,
            userId: $this->userId
        );

        if (! $sent) {
            Log::warning("SendWhatsAppTemplateJob did not complete successfully for {$this->to}");
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(?\Throwable $exception): void
    {
        Log::error("SendWhatsAppTemplateJob permanently failed for {$this->to}: ".($exception ? $exception->getMessage() : 'Unknown error'));
    }
}
