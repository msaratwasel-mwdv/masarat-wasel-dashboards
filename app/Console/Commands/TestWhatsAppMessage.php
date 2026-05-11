<?php

namespace App\Console\Commands;

use App\Models\WhatsAppAccount;
use App\Models\WhatsAppTemplate;
use App\Services\WhatsApp\WhatsAppService;
use Illuminate\Console\Command;

class TestWhatsAppMessage extends Command
{
    protected $signature = 'whatsapp:test {phone} {template_name=hello_world}';
    protected $description = 'Send a test WhatsApp message';

    public function handle(WhatsAppService $service)
    {
        $phone = $this->argument('phone');
        $templateName = $this->argument('template_name');

        $account = WhatsAppAccount::where('status', 'active')->first();
        if (!$account) {
            $this->error('No active WhatsApp account found.');
            return;
        }

        $template = WhatsAppTemplate::where('name', $templateName)->first();
        if (!$template) {
            $this->error("Template '{$templateName}' not found in database. Run whatsapp:sync-templates first.");
            return;
        }

        $this->info("Sending template '{$templateName}' to {$phone}...");

        $result = $service->sendTemplate($account, $phone, $template, []);

        if ($result['success'] ?? false) {
            $this->info("Message sent successfully! Message ID: " . $result['message_id']);
        } else {
            $this->error("Failed to send message.");
            $this->error(print_r($result['error'] ?? 'Unknown error', true));
        }
    }
}
