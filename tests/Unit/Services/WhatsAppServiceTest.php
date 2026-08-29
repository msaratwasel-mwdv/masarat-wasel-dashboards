<?php

namespace Tests\Unit\Services;

use App\Models\SystemSetting;
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

    public function test_send_template_calls_meta_api_successfully_and_logs_to_database(): void
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
            templateName: 'student_bus_status',
            parameters: ['أحمد', '101'],
            lang: 'ar'
        );

        $this->assertTrue($success);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'mock_phone_id_456/messages')
                && $request['messaging_product'] === 'whatsapp'
                && $request['to'] === '967771234567'
                && $request['template']['name'] === 'student_bus_status';
        });

        // Verify Log creation
        $this->assertDatabaseHas('whatsapp_logs', [
            'recipient_phone' => '771234567',
            'template_name' => 'student_bus_status',
            'status' => 'sent',
            'wamid' => 'wamid.HBgLMTIzNDU2Nzg5MA==',
        ]);
    }

    public function test_send_template_with_header_image(): void
    {
        Http::fake([
            'https://graph.facebook.com/*' => Http::response([
                'messaging_product' => 'whatsapp',
                'messages' => [['id' => 'wamid.HEADER_TEST_123']],
            ], 200),
        ]);

        $success = $this->whatsAppService->sendTemplate(
            to: '771234567',
            templateName: 'student_bus_status',
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

    public function test_send_template_skips_when_master_kill_switch_is_disabled(): void
    {
        Http::fake();

        SystemSetting::set('whatsapp_master_switch', false, 'whatsapp', 'boolean');

        $success = $this->whatsAppService->sendTemplate(
            to: '771234567',
            templateName: 'student_bus_status',
            parameters: ['أحمد', '101']
        );

        $this->assertFalse($success);
        Http::assertNothingSent();

        $this->assertDatabaseHas('whatsapp_logs', [
            'recipient_phone' => '771234567',
            'status' => 'skipped',
        ]);
    }

    public function test_send_template_skips_when_template_switch_is_disabled(): void
    {
        Http::fake();

        SystemSetting::set('whatsapp_master_switch', true, 'whatsapp', 'boolean');
        SystemSetting::set('whatsapp_template_bus_trip_summary_enabled', false, 'whatsapp', 'boolean');

        $success = $this->whatsAppService->sendTemplate(
            to: '771234567',
            templateName: 'bus_trip_summary',
            parameters: ['تقرير رحلة']
        );

        $this->assertFalse($success);
        Http::assertNothingSent();

        $this->assertDatabaseHas('whatsapp_logs', [
            'template_name' => 'bus_trip_summary',
            'status' => 'skipped',
        ]);
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
            templateName: 'student_bus_status',
            parameters: ['أحمد', '101']
        );

        $this->assertFalse($success);
        Http::assertNothingSent();

        $this->assertDatabaseHas('whatsapp_logs', [
            'recipient_phone' => '771234567',
            'status' => 'skipped',
        ]);
    }

    public function test_send_template_handles_api_failure_and_logs_error(): void
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

        $this->assertDatabaseHas('whatsapp_logs', [
            'recipient_phone' => '771234567',
            'template_name' => 'invalid_template',
            'status' => 'failed',
        ]);
    }

    public function test_format_phone_number_formats_yemen_oman_and_saudi_numbers(): void
    {
        $this->assertEquals('967771234567', $this->whatsAppService->formatPhoneNumber('771234567'));
        $this->assertEquals('967771234567', $this->whatsAppService->formatPhoneNumber('0771234567'));
        $this->assertEquals('96891234567', $this->whatsAppService->formatPhoneNumber('91234567'));
        $this->assertEquals('966501234567', $this->whatsAppService->formatPhoneNumber('501234567'));
    }
}
