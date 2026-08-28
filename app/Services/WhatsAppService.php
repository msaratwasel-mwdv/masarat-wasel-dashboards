<?php

namespace App\Services;

use App\Models\SystemSetting;
use App\Models\User;
use App\Models\WhatsAppLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $token;

    protected string $phoneId;

    protected string $baseUrl;

    /**
     * باني الكلاس (Constructor)
     */
    public function __construct()
    {
        $this->token = config('services.meta_whatsapp.token') ?? '';
        $this->phoneId = config('services.meta_whatsapp.phone_number_id') ?? '';
        $this->baseUrl = "https://graph.facebook.com/v25.0/{$this->phoneId}/messages";
    }

    /**
     * فحص ما إذا كانت خدمة رسائل الواتساب مفعلة بشكل عام (Master Switch)
     */
    public function isServiceEnabled(): bool
    {
        return (bool) SystemSetting::get('whatsapp_master_switch', true);
    }

    /**
     * فحص ما إذا كان قالب معين مفعلاً للإرسال
     */
    public function isTemplateEnabled(string $templateName): bool
    {
        if (! $this->isServiceEnabled()) {
            return false;
        }

        return (bool) SystemSetting::get("whatsapp_template_{$templateName}_enabled", true);
    }

    /**
     * قائمة القوالب المعروفة في النظام مع تفاصيلها
     */
    public function getAvailableTemplates(): array
    {
        return [
            [
                'name' => 'student_bus_status',
                'title_ar' => 'إشعار صعود/نزول الطالب من الحافلة',
                'title_en' => 'Student Bus Boarding/Alighting Status',
                'description_ar' => 'يُرسل لولي الأمر لحظياً عند ركوب أو نزول الطالب من الحافلة المدرسية مع تفاصيل السائق والمشرفة.',
                'description_en' => 'Sent to the parent in real-time when the student boards or alights the bus.',
                'target' => 'parent',
                'default_enabled' => true,
            ],
            [
                'name' => 'bus_trip_report',
                'title_ar' => 'تقرير الرحلة المدرسية المكتملة',
                'title_en' => 'Completed Bus Trip Report',
                'description_ar' => 'يُرسل لإدارة المدرسة عند انتهاء الرحلة متضمناً إحصائيات الحضور والغياب ومدة ومسافة الرحلة.',
                'description_en' => 'Sent to the school admin upon trip completion with detailed stats.',
                'target' => 'school_admin',
                'default_enabled' => true,
            ],
        ];
    }

    /**
     * دالة إرسال القوالب المحدثة لدعم نصوص الـ Body وصور الـ Header وتسجيل الـ Logs ومفاتيح التحكم
     */
    public function sendTemplate(
        string $to,
        string $templateName,
        array $parameters,
        string $lang = 'ar',
        ?string $headerImageUrl = null,
        ?string $eventType = null,
        ?int $userId = null
    ): bool {
        // 1. فحص المفتاح العام ومفتاح القالب المحدد (Master Switch & Template Switch)
        if (! $this->isTemplateEnabled($templateName)) {
            Log::info("Skipping WhatsApp template send: Template '{$templateName}' or WhatsApp master switch is disabled.");

            WhatsAppLog::create([
                'user_id' => $userId,
                'recipient_phone' => $to,
                'template_name' => $templateName,
                'event_type' => $eventType,
                'parameters' => $parameters,
                'header_image_url' => $headerImageUrl,
                'status' => 'skipped',
                'error_message' => 'Service or template disabled via settings.',
                'sent_at' => now(),
            ]);

            return false;
        }

        // 2. التحقق مما إذا كان الرقم مسجلاً في قاعدة بياناتنا ولديه واتساب نشط
        $cleanPhone = preg_replace('/[^0-9]/', '', $to);
        $last9Digits = substr($cleanPhone, -9);
        $user = null;

        if ($userId) {
            $user = User::find($userId);
        } elseif (strlen($last9Digits) >= 8) {
            $user = User::where('phone', 'like', "%$last9Digits")->first();
        }

        if ($user && ! $user->is_whatsapp_active) {
            Log::info("Skipping WhatsApp template send: User's WhatsApp status is inactive. Phone: $to");

            WhatsAppLog::create([
                'user_id' => $user->id,
                'recipient_phone' => $to,
                'recipient_name' => $user->name,
                'recipient_type' => $user->role,
                'template_name' => $templateName,
                'event_type' => $eventType,
                'parameters' => $parameters,
                'header_image_url' => $headerImageUrl,
                'status' => 'skipped',
                'error_message' => 'User WhatsApp status is marked inactive in database.',
                'sent_at' => now(),
            ]);

            return false;
        }

        $formattedPhone = $this->formatPhoneNumber($to);

        // 3. بناء مكونات الرسالة (Body + Optional Header)
        $components = [
            [
                'type' => 'body',
                'parameters' => collect($parameters)->map(function ($value) {
                    return ['type' => 'text', 'text' => (string) $value];
                })->toArray(),
            ],
        ];

        if ($headerImageUrl) {
            array_unshift($components, [
                'type' => 'header',
                'parameters' => [
                    [
                        'type' => 'image',
                        'image' => [
                            'link' => $headerImageUrl,
                        ],
                    ],
                ],
            ]);
        }

        try {
            $response = Http::withToken($this->token)
                ->post($this->baseUrl, [
                    'messaging_product' => 'whatsapp',
                    'to' => $formattedPhone,
                    'type' => 'template',
                    'template' => [
                        'name' => $templateName,
                        'language' => [
                            'code' => $lang,
                        ],
                        'components' => $components,
                    ],
                ]);

            $status = $response->status();
            $body = $response->json();
            Log::info("Meta WhatsApp API Response Status: {$status} Body: ".$response->body());

            if ($response->successful()) {
                $wamid = $body['messages'][0]['id'] ?? null;

                WhatsAppLog::create([
                    'user_id' => $user?->id,
                    'recipient_phone' => $to,
                    'recipient_name' => $user?->name,
                    'recipient_type' => $user?->role,
                    'template_name' => $templateName,
                    'event_type' => $eventType,
                    'parameters' => $parameters,
                    'header_image_url' => $headerImageUrl,
                    'wamid' => $wamid,
                    'status' => 'sent',
                    'sent_at' => now(),
                ]);

                return true;
            }

            Log::error('Meta WhatsApp API Error: '.$response->body());

            WhatsAppLog::create([
                'user_id' => $user?->id,
                'recipient_phone' => $to,
                'recipient_name' => $user?->name,
                'recipient_type' => $user?->role,
                'template_name' => $templateName,
                'event_type' => $eventType,
                'parameters' => $parameters,
                'header_image_url' => $headerImageUrl,
                'status' => 'failed',
                'error_message' => $response->body(),
                'sent_at' => now(),
            ]);

            return false;

        } catch (\Exception $e) {
            Log::error('Meta WhatsApp Exception: '.$e->getMessage());

            WhatsAppLog::create([
                'user_id' => $user?->id,
                'recipient_phone' => $to,
                'recipient_name' => $user?->name,
                'recipient_type' => $user?->role,
                'template_name' => $templateName,
                'event_type' => $eventType,
                'parameters' => $parameters,
                'header_image_url' => $headerImageUrl,
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'sent_at' => now(),
            ]);

            return false;
        }
    }

    /**
     * دالة مساعدة لتهيئة رقم الهاتف بالصيغة الدولية المتوافقة مع اليمن وعُمان والسعودية
     */
    public function formatPhoneNumber(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);

        if (str_starts_with($phone, '00')) {
            $phone = substr($phone, 2);
        }

        if (str_starts_with($phone, '0')) {
            $phone = substr($phone, 1);
        }

        // أ) أرقام اليمن (9 أرقام تبدأ بـ 7 أو 1)
        if (strlen($phone) === 9 && (str_starts_with($phone, '7') || str_starts_with($phone, '1'))) {
            return '967'.$phone;
        }

        // ب) أرقام عُمان (8 أرقام تبدأ بـ 9 أو 7)
        if (strlen($phone) === 8 && (str_starts_with($phone, '9') || str_starts_with($phone, '7'))) {
            return '968'.$phone;
        }

        // ج) أرقام السعودية (9 أرقام تبدأ بـ 5)
        if (strlen($phone) === 9 && str_starts_with($phone, '5')) {
            return '966'.$phone;
        }

        return $phone;
    }
}
