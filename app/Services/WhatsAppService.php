<?php

namespace App\Services;

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
        $this->token = config('services.meta_whatsapp.token');
        $this->phoneId = config('services.meta_whatsapp.phone_number_id');
        $this->baseUrl = "https://graph.facebook.com/v25.0/{$this->phoneId}/messages";
    }

    /**
     * دالة إرسال القوالب المحدثة لدعم نصوص الـ Body وصور الـ Header
     */
    public function sendTemplate(string $to, string $templateName, array $parameters, string $lang = 'ar', ?string $headerImageUrl = null): bool
    {
        // التحقق مما إذا كان الرقم مسجلاً في قاعدة بياناتنا ولديه واتساب نشط
        $cleanPhone = preg_replace('/[^0-9]/', '', $to);
        $last9Digits = substr($cleanPhone, -9);
        if (strlen($last9Digits) >= 8) {
            $user = \App\Models\User::where('phone', 'like', "%$last9Digits")->first();
            if ($user && ! $user->is_whatsapp_active) {
                Log::info("Skipping WhatsApp template send: User's WhatsApp status is inactive. Phone: $to");

                return false;
            }
        }

        $formattedPhone = $this->formatPhoneNumber($to);

        // 1. بناء المكون الأساسي لمتغيرات نص الرسالة (Body)
        $components = [
            [
                'type' => 'body',
                'parameters' => collect($parameters)->map(function ($value) {
                    return ['type' => 'text', 'text' => (string) $value];
                })->toArray(),
            ],
        ];

        // 2. إذا تم تمرير رابط صورة، ندمج مكون الـ Header في مصفوفة ميتا لحل مشكلة المرفقات
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

            Log::info('Meta WhatsApp API Response Status: '.$response->status().' Body: '.$response->body());

            if ($response->successful()) {
                return true;
            }

            Log::error('Meta WhatsApp API Error: '.$response->body());

            return false;

        } catch (\Exception $e) {
            Log::error('Meta WhatsApp Exception: '.$e->getMessage());

            return false;
        }
    }

    /**
     * دالة مساعدة لتهيئة رقم الهاتف بالصيغة الدولية المتوافقة مع اليمن وعُمان
     */
    private function formatPhoneNumber(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);

        if (str_starts_with($phone, '00')) {
            $phone = substr($phone, 2);
        }

        if (str_starts_with($phone, '0')) {
            $phone = substr($phone, 1);
        }

        // أ) التحقق من أرقام اليمن (9 أرقام تبدأ بـ 7 أو 1)
        if (strlen($phone) === 9 && (str_starts_with($phone, '7') || str_starts_with($phone, '1'))) {
            return '967'.$phone;
        }

        // ب) التحقق من أرقام عُمان (8 أرقام تبدأ بـ 9 أو 7)
        if (strlen($phone) === 8 && (str_starts_with($phone, '9') || str_starts_with($phone, '7'))) {
            return '968'.$phone;
        }

        return $phone;
    }
}
