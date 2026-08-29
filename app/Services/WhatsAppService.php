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
                'title_ar' => 'إشعار صعود ونزول الطالب من الحافلة',
                'title_en' => 'Student Bus Boarding/Alighting Status',
                'description_ar' => 'يُرسل لولي الأمر لحظياً عند ركوب أو نزول الطالب من الحافلة المدرسية متضمناً تفاصيل السائق والمشرفة والمدرسة.',
                'description_en' => 'Sent to the parent in real-time when the student boards or alights the bus.',
                'target' => 'parent',
                'default_enabled' => true,
                'header_image' => '/assets/images/student_bus_status.png',
                'sample_body' => "👋 تحديث حالة الطالب\n\nعزيزي الوالد: فضل المطري\nتحياتي، نود أن نبلغكم بحالة الطالب:\n\n👦 الاسم: أحمد فضل\n🚌 الحالة: صعد الحافلة ✅\n👨✈️ السائق: نجيب الصلوان\n🏫 المشرفة: فاطمة علي\n📞 رقم الاتصال: 775376507\n\n🏫 المدرسة العصرية الحديثة | شكراً لتعاونكم 🤝",
            ],
            [
                'name' => 'bus_trip_summary',
                'title_ar' => 'تقرير رحلة الحافلة المدرسية التفصيلي',
                'title_en' => 'Detailed Bus Trip Summary Report',
                'description_ar' => 'يُرسل لإدارة المدرسة عند انتهاء الرحلة متضمناً إحصائيات الحضور والغياب ومدة ومسافة الرحلة التفصيلية.',
                'description_en' => 'Sent to the school admin upon trip completion with detailed stats.',
                'target' => 'school_admin',
                'default_enabled' => true,
                'header_image' => '/assets/images/bus_trip_report.png',
                'sample_body' => "📢 تقرير رحلة الحافلة المدرسية التفصيلي\n🏫 المدرسة: المدرسة العصرية الحديثة\n📅 التاريخ: 2026/05/24\n🚌 رقم الحافلة: B-202\n🕒 بدء الرحلة: 07:00 ص\n🕓 انتهاء الرحلة: 08:15 ص\n\n⏳ مدة الانتظار: 00:15 دقيقة\n🕒 مدة الرحلة: 01:15 ساعة\n📏 المسافة: 25 كم\n\n👥 الحضور: 24\n🚫 الغياب: 2\n\n✅ وصلت الحافلة B-202 إلى المدرسة بسلام\n🤝 نشكر لكم شراكتكم وثقتكم بنا",
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

        // تعيين صورة الهيدر التلقائية إذا كان القالب يتطلب صورة ولم تُمرر صراحة
        if (! $headerImageUrl) {
            if ($templateName === 'student_bus_status') {
                $headerImageUrl = url('assets/images/student_bus_status.png');
                if (str_contains($headerImageUrl, 'localhost') || str_contains($headerImageUrl, '.test') || str_contains($headerImageUrl, '127.0.0.1')) {
                    $headerImageUrl = 'https://images.unsplash.com/photo-1557223562-6c77ef16210f?w=800';
                }
            } elseif ($templateName === 'bus_trip_summary' || $templateName === 'bus_trip_report') {
                $headerImageUrl = url('assets/images/bus_trip_report.png');
                if (str_contains($headerImageUrl, 'localhost') || str_contains($headerImageUrl, '.test') || str_contains($headerImageUrl, '127.0.0.1')) {
                    $headerImageUrl = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800';
                }
            }
        }

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
