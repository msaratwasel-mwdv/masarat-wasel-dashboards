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

    public function normalizeLanguageCode(string $lang): string
    {
        $lang = trim($lang);
        if (in_array(strtolower($lang), ['en', 'en_us', 'en-us'])) {
            return config('services.meta_whatsapp.english_code', 'en');
        }

        if (in_array(strtolower($lang), ['ar', 'ar_ae', 'ar_sa', 'ar-ae', 'ar-sa'])) {
            return 'ar';
        }

        return $lang;
    }

    /**
     * قائمة القوالب المعروفة في النظام مع تفاصيلها
     */
    public function getAvailableTemplates(): array
    {
        return [
            [
                'name' => 'student_bus_status',
                'title_ar' => 'تقرير رحلة الطالب اليومي (عربي)',
                'title_en' => 'Daily Student Trip Report (Arabic)',
                'description_ar' => 'يُرسل لولي الأمر لحظياً عند ركوب الطالب للحافلة متضمناً أوقات الوصول والانتظار وتفاصيل الطاقم.',
                'description_en' => 'Sent to parents in real-time when the student boards the bus with arrival and waiting times.',
                'target' => 'parent',
                'lang' => 'ar',
                'default_enabled' => true,
                'header_image' => '/assets/images/student_bus_status.png',
                'sample_body' => "📢 تقرير رحلة الحافلة المدرسية اليومي\n📅 التاريخ: 2026/05/24\n\n👦 اسم الطالب: أحمد فضل\n🏨 اسم المدرسة: جبل المعرفة الدولية\n🚌 تحديث الحالة: صعد الحافلة ✅\n🕒 وقت وصول الحافلة للمنزل: 06:55 ص\n⏳ وقت الانتظار خارج المنزل: 3 دقائق\n🕒 وقت صعود الطالب للحافلة: 07:00 ص\n🧑✈️ اسم السائق: نجيب الصلوان\n🧕 اسم المشرفة: فاطمة علي\n📞 رقم الاتصال: 775376507\n\nمسارات واصل شريككم الآمن\nشاكرين لكم ثقتكم 🤝",
            ],
            [
                'name' => 'student_bus_status_en',
                'title_ar' => 'تقرير رحلة الطالب اليومي (إنجليزي)',
                'title_en' => 'Daily Student Trip Report (English)',
                'description_ar' => 'النسخة الإنجليزية التي تُرسل تلقائياً لأولياء الأمور المفضلين للغة الإنجليزية.',
                'description_en' => 'English version automatically sent to parents whose preferred language is English.',
                'target' => 'parent',
                'lang' => 'en',
                'default_enabled' => true,
                'header_image' => '/assets/images/student_bus_status.png',
                'sample_body' => "📢 Daily School Bus Trip Report\n📅 Date: 2026/05/24\n\n👦 Student Name: Ahmed Fadel\n🏨 School Name: Jabal Al-Maarefa International\n🚌 Status Update: Boarded the bus ✅\n🕒 Bus Arrival Time at Home: 06:55 AM\n⏳ Waiting Time Outside Home: 3 mins\n🕒 Student Boarding Time: 07:00 AM\n🧑✈️ Driver Name: Najeeb Al-Salwan\n🧕 Supervisor Name: Fatima Ali\n📞 Contact Number: +967775376507\n\nMasarat Wasel - Your Safe Partner\nThank you for your trust 🤝",
            ],
            [
                'name' => 'bus_trip_summary',
                'title_ar' => 'تقرير رحلة الحافلة التفصيلي (عربي)',
                'title_en' => 'Detailed Bus Trip Summary Report (Arabic)',
                'description_ar' => 'يُرسل لإدارة المدرسة عند انتهاء الرحلة متضمناً إحصائيات الحضور والغياب ومدة ومسافة الرحلة التفصيلية.',
                'description_en' => 'Sent to school admins upon trip completion with attendance stats and distance in Arabic.',
                'target' => 'school_admin',
                'lang' => 'ar',
                'default_enabled' => true,
                'header_image' => '/assets/images/bus_trip_report.png',
                'sample_body' => "📢 تقرير رحلة الحافلة المدرسية التفصيلي\n🏫 المدرسة: جبل المعرفة الدولية\n📅 التاريخ: 2026/05/24\n🚌 رقم الحافلة: B-202\n🕒 بدء الرحلة: 07:00 ص\n🕓 انتهاء الرحلة: 08:15 ص\n\n⏳ مدة الانتظار: 00:15 دقيقة\n🕒 مدة الرحلة: 01:15 ساعة\n📏 المسافة: 25 كم\n\n👥 الحضور: 24\n🚫 الغياب: 2\n\n✅ وصلت الحافلة B-202 إلى المدرسة بسلام\n🤝 نشكر لكم شراكتكم وثقتكم بنا",
            ],
            [
                'name' => 'bus_trip_summary_en',
                'title_ar' => 'تقرير رحلة الحافلة التفصيلي (إنجليزي)',
                'title_en' => 'Detailed Bus Trip Summary Report (English)',
                'description_ar' => 'النسخة الإنجليزية التي تُرسل لإدارة المدرسة باللغة الإنجليزية عند انتهاء الرحلة.',
                'description_en' => 'Sent to school admins upon trip completion in English.',
                'target' => 'school_admin',
                'lang' => 'en',
                'default_enabled' => true,
                'header_image' => '/assets/images/bus_trip_report.png',
                'sample_body' => "📢 School Bus Trip Detailed Report\n🏫 School: Jabal Al-Maarefa International\n📅 Date: 2026/05/24\n🚌 Bus Number: B-202\n🕒 Departure Time: 07:00 AM\n🕓 Arrival Time: 08:15 AM\n\n⏳ Waiting Duration: 15 mins\n🕒 Trip Duration: 1 hr 15 mins\n📏 Distance: 25 km\n\n👥 Present: 24\n🚫 Absent: 2\n\n✅ Bus B-202 has arrived safely at school\n🤝 Thank you for your partnership and trust",
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
            if (str_starts_with($templateName, 'student_bus_status') || str_starts_with($templateName, 'student_daily_trip_report')) {
                $headerImageUrl = url('assets/images/student_bus_status.png');
                if (str_contains($headerImageUrl, 'localhost') || str_contains($headerImageUrl, '.test') || str_contains($headerImageUrl, '127.0.0.1')) {
                    $headerImageUrl = 'https://images.unsplash.com/photo-1557223562-6c77ef16210f?w=800';
                }
            } elseif (str_starts_with($templateName, 'bus_trip_summary') || str_starts_with($templateName, 'bus_trip_report')) {
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

        $normalizedLang = $this->normalizeLanguageCode($lang);

        try {
            $payload = [
                'messaging_product' => 'whatsapp',
                'to' => $formattedPhone,
                'type' => 'template',
                'template' => [
                    'name' => $templateName,
                    'language' => [
                        'code' => $normalizedLang,
                    ],
                    'components' => $components,
                ],
            ];

            $response = Http::withToken($this->token)->post($this->baseUrl, $payload);
            $status = $response->status();
            $body = $response->json();
            Log::info("Meta WhatsApp API Response Status: {$status} Body: ".$response->body());

            // معالجة ذكية: إذا فشل بسبب رمز اللغة الإنجليزية (en مقابل en_US)، إعادة المحاولة بالرمز البديل تلقائياً
            if (! $response->successful() && in_array($normalizedLang, ['en', 'en_US'])) {
                $alternateLang = ($normalizedLang === 'en') ? 'en_US' : 'en';
                $errMessage = $body['error']['message'] ?? '';
                if (str_contains($errMessage, 'does not exist in the translated language') || ($body['error']['code'] ?? null) === 132001) {
                    Log::info("Retrying template {$templateName} with alternate language code: {$alternateLang}");
                    $payload['template']['language']['code'] = $alternateLang;
                    $response = Http::withToken($this->token)->post($this->baseUrl, $payload);
                    $status = $response->status();
                    $body = $response->json();
                }
            }

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
