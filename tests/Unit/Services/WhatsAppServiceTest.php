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

    public function test_send_english_template_normalizes_language_and_sends_successfully(): void
    {
        Http::fake([
            'https://graph.facebook.com/*' => Http::response([
                'messaging_product' => 'whatsapp',
                'messages' => [['id' => 'wamid.EN_TEST_123']],
            ], 200),
        ]);

        $success = $this->whatsAppService->sendTemplate(
            to: '771234567',
            templateName: 'student_bus_status_en',
            parameters: ['2026/05/24', 'Ahmed', 'School', 'Boarded the bus ✅', '07:00 AM', '3 mins', '07:03 AM', 'Driver', 'Supervisor', '77xxxxxxx'],
            lang: 'en'
        );

        $this->assertTrue($success);

        Http::assertSent(function ($request) {
            return $request['template']['name'] === 'student_bus_status_en'
                && $request['template']['language']['code'] === 'en'
                && count($request['template']['components'][1]['parameters']) === 10;
        });
    }

    public function test_send_template_retries_with_alternate_english_code_on_language_not_found(): void
    {
        Http::fake([
            'https://graph.facebook.com/*' => Http::sequence()
                ->push(['error' => ['message' => 'Template does not exist in the translated language', 'code' => 132001]], 400)
                ->push(['messaging_product' => 'whatsapp', 'messages' => [['id' => 'wamid.RETRY_SUCCESS']]], 200),
        ]);

        $success = $this->whatsAppService->sendTemplate(
            to: '771234567',
            templateName: 'bus_trip_summary_en',
            parameters: ['School', '2026/05/24', 'B-202', '07:00 AM', '08:15 AM', '15 mins', '1 hr', '25 km', '20', '1', 'B-202'],
            lang: 'en'
        );

        $this->assertTrue($success);

        // Assert two requests were made (original 'en' then retry 'en_US')
        Http::assertSentCount(2);
    }

    public function test_get_available_templates_includes_arabic_and_english_versions(): void
    {
        $templates = $this->whatsAppService->getAvailableTemplates();
        $names = array_column($templates, 'name');

        $this->assertContains('student_bus_status', $names);
        $this->assertContains('student_bus_status_en', $names);
        $this->assertContains('bus_trip_summary', $names);
        $this->assertContains('bus_trip_summary_en', $names);
    }
}
