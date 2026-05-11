<?php

namespace App\Services\WhatsApp;

use App\Models\WhatsAppAccount;
use App\Models\WhatsAppMessage;
use App\Models\WhatsAppTemplate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $baseUrl = 'https://graph.facebook.com/v20.0';

    /**
     * Send a template message.
     */
    public function sendTemplate(
        WhatsAppAccount $account,
        string $recipientPhone,
        WhatsAppTemplate $template,
        array $components,
        ?int $userId = null
    ): array {
        $recipientPhone = $this->normalizePhone($recipientPhone);

        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => $recipientPhone,
            'type' => 'template',
            'template' => [
                'name' => $template->name,
                'language' => [
                    'code' => $template->language,
                ],
                'components' => $this->formatComponents($components),
            ],
        ];

        $response = Http::withToken($account->access_token)
            ->post("{$this->baseUrl}/{$account->phone_number_id}/messages", $payload);

        $data = $response->json();

        if ($response->successful()) {
            $messageId = $data['messages'][0]['id'] ?? null;
            
            WhatsAppMessage::create([
                'whatsapp_account_id' => $account->id,
                'whatsapp_template_id' => $template->id,
                'meta_message_id' => $messageId,
                'recipient_phone' => $recipientPhone,
                'recipient_user_id' => $userId,
                'status' => 'sent',
                'template_variables_snapshot' => $components,
                'sent_at' => now(),
            ]);

            return ['success' => true, 'message_id' => $messageId];
        }

        Log::error('[WhatsApp] Send Failed', [
            'account_id' => $account->id,
            'response' => $data,
            'payload' => $payload,
        ]);

        return [
            'success' => false,
            'error' => $data['error']['message'] ?? 'Unknown error',
        ];
    }

    /**
     * Normalize phone number to E.164 format.
     */
    public function normalizePhone(string $phone): string
    {
        // Remove non-numeric characters
        $cleaned = preg_replace('/[^0-9]/', '', $phone);

        // Assume Saudi Arabia (966) if it starts with 05
        if (str_starts_with($cleaned, '05') && strlen($cleaned) === 10) {
            return '966' . substr($cleaned, 1);
        }

        // If it starts with 5 and is 9 digits, assume Saudi (966)
        if (str_starts_with($cleaned, '5') && strlen($cleaned) === 9) {
            return '966' . $cleaned;
        }

        return $cleaned;
    }

    /**
     * Format components for Meta API.
     * Expects an array of components (body, header, etc.) with their variables.
     */
    protected function formatComponents(array $components): array
    {
        $formatted = [];

        // Simple grouping by component type if needed, but for templates usually just 'body'
        // This is a simplified version; real-world templates might have headers/buttons
        
        $bodyParams = [];
        foreach ($components as $variable) {
            $bodyParams[] = [
                'type' => 'text',
                'text' => (string) ($variable['text'] ?? ''),
            ];
        }

        if (!empty($bodyParams)) {
            $formatted[] = [
                'type' => 'body',
                'parameters' => $bodyParams,
            ];
        }

        return $formatted;
    }
}
