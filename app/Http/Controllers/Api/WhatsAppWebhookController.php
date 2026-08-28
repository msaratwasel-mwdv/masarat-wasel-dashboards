<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WhatsAppLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WhatsAppWebhookController extends Controller
{
    /**
     * معالجة طلبات الـ Webhook من Meta WhatsApp
     */
    public function handle(Request $request)
    {
        // 1. التحقق من صحة الـ Webhook (Verification Step) - للـ GET Requests
        if ($request->isMethod('get')) {
            $mode = $request->query('hub_mode');
            $token = $request->query('hub_verify_token');
            $challenge = $request->query('hub_challenge');

            $verifyToken = config('services.meta_whatsapp.webhook_verify_token', 'masarat_wasel_webhook_verify_2026');

            if ($mode && $token) {
                if ($mode === 'subscribe' && $token === $verifyToken) {
                    Log::info('WhatsApp Webhook verified successfully!');

                    return response($challenge, 200)->header('Content-Type', 'text/plain');
                }
            }

            Log::warning('WhatsApp Webhook verification failed.', $request->all());

            return response('Forbidden', 403);
        }

        // 2. معالجة تحديثات حالة الرسائل والرسائل الواردة - للـ POST Requests
        $payload = $request->all();

        Log::info('WhatsApp Webhook Received Payload: '.json_encode($payload, JSON_UNESCAPED_UNICODE));

        // تفكيك حالة الرسائل وتحديث سجلات WhatsAppLog
        if (isset($payload['entry'][0]['changes'][0]['value']['statuses'][0])) {
            $status = $payload['entry'][0]['changes'][0]['value']['statuses'][0];
            $messageId = $status['id'] ?? null;
            $messageStatus = $status['status'] ?? 'unknown'; // sent, delivered, read, failed
            $recipient = $status['recipient_id'] ?? 'unknown';

            Log::info("WhatsApp Message Status Update - ID: {$messageId}, Status: {$messageStatus}, To: {$recipient}");

            // تحديث سجل الرسالة في قاعدة البيانات
            if ($messageId) {
                $logUpdate = ['status' => $messageStatus];
                if ($messageStatus === 'failed' && isset($status['errors'][0])) {
                    $logUpdate['error_message'] = json_encode($status['errors'][0], JSON_UNESCAPED_UNICODE);
                }
                WhatsAppLog::where('wamid', $messageId)->update($logUpdate);
            }

            if ($messageStatus === 'failed') {
                // تلقائياً نقوم بتعطيل الواتساب لهذا الرقم لحماية سمعة الحساب في Meta
                $cleanPhone = preg_replace('/[^0-9]/', '', $recipient);
                $last9Digits = substr($cleanPhone, -9);
                if (strlen($last9Digits) >= 8) {
                    $user = User::where('phone', 'like', "%{$last9Digits}")->first();
                    if ($user && $user->is_whatsapp_active) {
                        $user->is_whatsapp_active = false;
                        $user->save();
                        Log::warning("WhatsApp Webhook auto-disabled WhatsApp for User ID: {$user->id} due to delivery failure on phone: {$recipient}");
                    }
                }

                if (isset($status['errors'][0])) {
                    $error = $status['errors'][0];
                    Log::error('WhatsApp Delivery Failure Details - Code: '.($error['code'] ?? 'N/A').' | Message: '.($error['message'] ?? 'N/A').' | Details: '.($error['error_data']['details'] ?? 'N/A'));
                }
            }
        }

        return response()->json(['status' => 'success']);
    }
}
