<?php

namespace App\Jobs;

use App\Models\WhatsAppAccount;
use App\Models\WhatsAppTemplate;
use App\Services\WhatsApp\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWhatsAppMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public WhatsAppAccount $account,
        public string $recipientPhone,
        public WhatsAppTemplate $template,
        public array $components,
        public ?int $userId = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(WhatsAppService $service): void
    {
        $service->sendTemplate(
            $this->account,
            $this->recipientPhone,
            $this->template,
            $this->components,
            $this->userId
        );
    }
}
