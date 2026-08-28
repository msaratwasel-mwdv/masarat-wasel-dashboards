<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WhatsAppServiceTest extends TestCase
{
    protected WhatsAppService $whatsAppService;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.meta_whatsapp.token', 'mock_token_123');
        Config::set('services.meta_whatsapp.phone_number_id', 'mock_phone_id_456');

        $this->whatsAppService = new WhatsAppService;
    }

    public function test_send_template_calls_meta_api_successfully(): void
    {
        Http::fake([
            'https://graph.facebook.com/*' => Http::response([
                'messaging_product' => 'whatsapp',
                'contacts' => [['input' => '967771234567', 'wa_id' => '967771234567']],
                'messages' => [['id' => 'wamid.HBgLMTIzNDU2Nzg5MA==']],
            ], 200),
        ]);

        $success = $this->whatsAppService->sendTemplate(
            to: '771234567',
            templateName: 'student_boarded_bus',
            parameters: ['أحمد', '101'],
            lang: 'ar'
        );

        $this->assertTrue($success);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'mock_phone_id_456/messages')
                && $request['messaging_product'] === 'whatsapp'
                && $request['to'] === '967771234567'
                && $request['template']['name'] === 'student_boarded_bus';
        });
    }

    public function test_send_template_with_header_image(): void
    {
        Http::fake([
            'https://graph.facebook.com/*' => Http::response(['success' => true], 200),
        ]);

        $success = $this->whatsAppService->sendTemplate(
            to: '771234567',
            templateName: 'student_boarded_bus',
            parameters: ['سارة'],
            lang: 'ar',
            headerImageUrl: 'https://example.com/bus.png'
        );

        $this->assertTrue($success);

        Http::assertSent(function ($request) {
            $components = $request['template']['components'];

            return count($components) === 2
                && $components[0]['type'] === 'header'
                && $components[0]['parameters'][0]['image']['link'] === 'https://example.com/bus.png';
        });
    }

    public function test_send_template_skips_when_user_has_whatsapp_disabled(): void
    {
        Http::fake();

        User::factory()->create([
            'phone' => '771234567',
            'is_whatsapp_active' => false,
        ]);

        $success = $this->whatsAppService->sendTemplate(
            to: '771234567',
            templateName: 'student_boarded_bus',
            parameters: ['أحمد', '101']
        );

        $this->assertFalse($success);
        Http::assertNothingSent();
    }

    public function test_send_template_handles_api_failure(): void
    {
        Http::fake([
            'https://graph.facebook.com/*' => Http::response([
                'error' => ['message' => 'Invalid template'],
            ], 400),
        ]);

        $success = $this->whatsAppService->sendTemplate(
            to: '771234567',
            templateName: 'invalid_template',
            parameters: []
        );

        $this->assertFalse($success);
    }
}
