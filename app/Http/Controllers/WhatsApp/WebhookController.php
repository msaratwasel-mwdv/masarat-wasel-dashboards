<?php

namespace App\Http\Controllers\WhatsApp;

use App\Http\Controllers\Controller;
use App\Models\WhatsAppAccount;
use App\Models\WhatsAppMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Handle Meta Webhook Verification (GET)
     */
    public function verify(Request $request)
    {
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        // Allow dynamic verification using any active account or a global env variable
        $account = WhatsAppAccount::where('webhook_verify_token', $token)->first();
        
        $validToken = $account ? $account->webhook_verify_token : env('WHATSAPP_VERIFY_TOKEN');

        if ($mode === 'subscribe' && $token === $validToken) {
            Log::info('[WhatsApp Webhook] Verification successful.');
            return response($challenge, 200);
        }

        Log::warning('[WhatsApp Webhook] Verification failed.', ['token' => $token]);
        return response('Forbidden', 403);
    }

    /**
     * Handle Incoming Meta Webhook Events (POST)
     */
    public function handle(Request $request)
    {
        $payload = $request->all();

        // Log raw payload for debugging (can be moved to a db log table later)
        Log::debug('[WhatsApp Webhook] Received payload', ['payload' => $payload]);

        if (!isset($payload['object']) || $payload['object'] !== 'whatsapp_business_account') {
            return response('Not found', 404);
        }

        foreach ($payload['entry'] as $entry) {
            $changes = $entry['changes'] ?? [];
            
            foreach ($changes as $change) {
                $value = $change['value'] ?? [];
                
                // Handle Message Status Updates (Sent, Delivered, Read, Failed)
                if (isset($value['statuses'])) {
                    $this->processStatuses($value['statuses']);
                }

                // Handle Incoming Messages (Replies from parents/drivers)
                if (isset($value['messages'])) {
                    $this->processIncomingMessages($value['messages'], $value['metadata']['display_phone_number'] ?? null);
                }
            }
        }

        return response('EVENT_RECEIVED', 200);
    }

    /**
     * Process message delivery status updates
     */
    protected function processStatuses(array $statuses)
    {
        foreach ($statuses as $status) {
            $wamid = $status['id'] ?? null;
            $newStatus = $status['status'] ?? null;
            
            if (!$wamid || !$newStatus) continue;

            $message = WhatsAppMessage::where('meta_message_id', $wamid)->first();
            if (!$message) continue;

            $updateData = ['status' => $newStatus];

            if ($newStatus === 'delivered') {
                $updateData['delivered_at'] = now();
            } elseif ($newStatus === 'read') {
                $updateData['read_at'] = now();
            } elseif ($newStatus === 'failed') {
                $updateData['error_payload'] = $status['errors'] ?? null;
            }

            $message->update($updateData);
        }
    }

    /**
     * Process incoming messages (Optional for Phase 1, but good to log)
     */
    protected function processIncomingMessages(array $messages, ?string $displayPhoneNumber)
    {
        $account = WhatsAppAccount::where('display_phone', $displayPhoneNumber)->first();
        if (!$account) return;

        foreach ($messages as $msg) {
            $senderPhone = $msg['from'] ?? null;
            $wamid = $msg['id'] ?? null;
            
            if (!$senderPhone || !$wamid) continue;

            // Log incoming message
            WhatsAppMessage::create([
                'whatsapp_account_id' => $account->id,
                'meta_message_id' => $wamid,
                'recipient_phone' => $senderPhone, // The sender is the recipient in our context
                'direction' => 'inbound',
                'status' => 'delivered',
                'template_variables_snapshot' => $msg, // Store raw message data here for now
                'delivered_at' => now(),
            ]);
        }
    }
}
