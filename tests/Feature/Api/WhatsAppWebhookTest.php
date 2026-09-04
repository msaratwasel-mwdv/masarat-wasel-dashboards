<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\WhatsAppLog;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class WhatsAppWebhookTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.meta_whatsapp.webhook_verify_token', 'test_secret_token_123');
    }

    public function test_webhook_get_verification_succeeds_with_valid_token(): void
    {
        $response = $this->get('/api/whatsapp/webhook?'.http_build_query([
            'hub_mode' => 'subscribe',
            'hub_verify_token' => 'test_secret_token_123',
            'hub_challenge' => 'challenge_code_999',
        ]));

        $response->assertStatus(200);
        $this->assertEquals('challenge_code_999', $response->getContent());
    }

    public function test_webhook_get_verification_fails_with_invalid_token(): void
    {
        $response = $this->get('/api/whatsapp/webhook?'.http_build_query([
            'hub_mode' => 'subscribe',
            'hub_verify_token' => 'wrong_token',
            'hub_challenge' => 'challenge_code_999',
        ]));

        $response->assertStatus(403);
    }

    public function test_webhook_post_updates_message_status_to_delivered(): void
    {
        $log = WhatsAppLog::create([
            'recipient_phone' => '96777112233',
            'template_name' => 'student_bus_status',
            'status' => 'sent',
            'wamid' => 'wamid.HBgLTEST123456',
        ]);

        $payload = [
            'entry' => [
                [
                    'changes' => [
                        [
                            'value' => [
                                'statuses' => [
                                    [
                                        'id' => 'wamid.HBgLTEST123456',
                                        'status' => 'delivered',
                                        'recipient_id' => '96777112233',
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/api/whatsapp/webhook', $payload);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success']);

        $log->refresh();
        $this->assertEquals('delivered', $log->status);
    }

    public function test_webhook_post_handles_failure_and_disables_user_whatsapp(): void
    {
        $user = User::factory()->create([
            'phone' => '771234567',
            'is_whatsapp_active' => true,
        ]);

        $log = WhatsAppLog::create([
            'recipient_phone' => '967771234567',
            'template_name' => 'student_bus_status',
            'status' => 'sent',
            'wamid' => 'wamid.HBgLFAIL123',
        ]);

        $payload = [
            'entry' => [
                [
                    'changes' => [
                        [
                            'value' => [
                                'statuses' => [
                                    [
                                        'id' => 'wamid.HBgLFAIL123',
                                        'status' => 'failed',
                                        'recipient_id' => '967771234567',
                                        'errors' => [
                                            [
                                                'code' => 131026,
                                                'title' => 'Message Undeliverable',
                                                'message' => 'Receiver does not have WhatsApp account',
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/api/whatsapp/webhook', $payload);

        $response->assertStatus(200);

        $log->refresh();
        $user->refresh();

        $this->assertEquals('failed', $log->status);
        $this->assertNotNull($log->error_message);
        $this->assertFalse((bool) $user->is_whatsapp_active);
    }
}
