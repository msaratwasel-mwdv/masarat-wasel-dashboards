<?php

namespace App\Console\Commands;

use App\Models\WhatsAppAccount;
use App\Models\WhatsAppTemplate;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class SyncWhatsAppTemplates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'whatsapp:sync-templates {--account= : The ID of the WhatsApp account to sync}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch and sync approved templates from Meta WhatsApp Business API';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $accountId = $this->option('account');
        
        $query = WhatsAppAccount::where('status', 'active');
        if ($accountId) {
            $query->where('id', $accountId);
        }

        $accounts = $query->get();

        if ($accounts->isEmpty()) {
            $this->warn('No active WhatsApp accounts found.');
            return;
        }

        foreach ($accounts as $account) {
            $this->info("Syncing templates for Account ID: {$account->id} (WABA: {$account->waba_id})");
            $this->syncTemplatesForAccount($account);
        }

        $this->info('Template sync complete.');
    }

    protected function syncTemplatesForAccount(WhatsAppAccount $account)
    {
        // The API endpoint to fetch message templates
        // We use the waba_id, not phone_number_id
        $url = "https://graph.facebook.com/v20.0/{$account->waba_id}/message_templates";
        
        $response = Http::withToken($account->access_token)->get($url, [
            'limit' => 1000 // Adjust if necessary
        ]);

        if (!$response->successful()) {
            $this->error("Failed to fetch templates from Meta. Error: " . $response->body());
            return;
        }

        $templates = $response->json('data') ?? [];

        if (empty($templates)) {
            $this->info('No templates found in Meta account.');
            return;
        }

        $syncedCount = 0;

        foreach ($templates as $metaTemplate) {
            $status = strtoupper($metaTemplate['status']);
            
            // Update or Create the template record
            $template = WhatsAppTemplate::updateOrCreate(
                [
                    'whatsapp_account_id' => $account->id,
                    'name' => $metaTemplate['name'],
                    'language' => $metaTemplate['language'],
                ],
                [
                    'meta_template_id' => $metaTemplate['id'],
                    'category' => $metaTemplate['category'],
                    'status' => $status,
                    'components' => $metaTemplate['components'],
                    // Meta API doesn't always return quality_score in list, might need specific field request
                    'quality_score' => $metaTemplate['quality_score']['score'] ?? null,
                ]
            );

            // Here we could automatically extract variables from components if needed
            // For now, variables are managed manually via UI/seeders

            $syncedCount++;
        }

        $this->info("Successfully synced {$syncedCount} templates for Account ID: {$account->id}");
    }
}
