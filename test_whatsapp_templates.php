<?php

/**
 * سكربت اختبار قوالب واتساب لمشروع مسارات واصل (Masarat Wasel)
 * 
 * طريقة التشغيل من الترمينال:
 * 1. اختبار قالب حالة الطالب:
 *    php test_whatsapp_templates.php status
 * 
 * 2. اختبار قالب تقرير الرحلة:
 *    php test_whatsapp_templates.php report
 * 
 * 3. تشغيل الاختبار لرقم مخصص آخر:
 *    php test_whatsapp_templates.php status 967XXXXXXXXX
 *    php test_whatsapp_templates.php report 967XXXXXXXXX
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// 1. تحديد الهاتف الافتراضي (يمكنك تعديل الرقم الافتراضي أو تمريره كمعطى في الترمينال)
$defaultPhone = '775376507';
$targetPhone = isset($argv[2]) ? $argv[2] : $defaultPhone;

// تحديد نوع الاختبار (status أو report)
$testType = isset($argv[1]) ? strtolower($argv[1]) : null;

if (!$testType || !in_array($testType, ['status', 'report'])) {
    echo "\n=== سكربت اختبار قوالب واتساب ===\n";
    echo "يرجى تحديد نوع الاختبار وطريقة التشغيل كالتالي:\n\n";
    echo "  1. لاختبار قالب حالة الطالب (student_bus_status):\n";
    echo "     php test_whatsapp_templates.php status\n\n";
    echo "  2. لاختبار قالب تقرير الرحلة (bus_trip_report):\n";
    echo "     php test_whatsapp_templates.php report\n\n";
    echo "  3. لاختبار رقم مخصص آخر:\n";
    echo "     php test_whatsapp_templates.php status 96777777777\n";
    echo "=================================\n\n";
    exit(1);
}

$service = app(\App\Services\WhatsAppService::class);

// ضع هنا رابط النفق الفعلي الخاص بك (Cloudflare Tunnel) أثناء العمل المحلي
// أو سيقوم النظام تلقائياً بقراءته إن كان يعمل محلياً
$tunnelDomain = 'https://ringtones-broader-him-hist.trycloudflare.com';

if ($testType === 'status') {
    echo "جاري اختبار قالب [حالة الطالب - student_bus_status]...\n";
    echo "المستلم: $targetPhone\n";

    // المتغيرات الـ 7 بالترتيب
    $params = [
        'فضل المطري',         // {{1}} الوالد
        'أحمد فضل',           // {{2}} الطالب
        'صعد الحافلة ✅',      // {{3}} الحالة
        'نجيب الصلوان',        // {{4}} السائق
        'فاطمة علي',           // {{5}} المشرفة
        '775376507',          // {{6}} رقم الاتصال
        'المدرسة العصرية الحديثة' // {{7}} اسم المدرسة
    ];

    $imageUrl = $tunnelDomain . '/assets/images/student_bus_status.png';
    echo "رابط الصورة: $imageUrl\n";

    $result = $service->sendTemplate($targetPhone, 'student_bus_status', $params, 'ar', $imageUrl);
    echo "النتيجة: " . ($result ? "نجاح (تم الإرسال لـ Meta)" : "فشل (تفقد سجل laravel.log)") . "\n";

} elseif ($testType === 'report') {
    echo "جاري اختبار قالب [تقرير الرحلة - bus_trip_report]...\n";
    echo "المستلم: $targetPhone\n";

    // المتغيرات الـ 11 بالترتيب
    $params = [
        'المدرسة العصرية الحديثة', // {{1}} المدرسة
        '2026/05/24',            // {{2}} التاريخ
        'B-202',                 // {{3}} رقم الحافلة
        '07:00 ص',               // {{4}} بدء الرحلة
        '08:15 ص',               // {{5}} انتهاء الرحلة
        '00:15 دقيقة',           // {{6}} مدة الانتظار
        '01:15 ساعة',            // {{7}} مدة الرحلة
        '25 كم',                 // {{8}} المسافة
        '24',                    // {{9}} الحضور
        '2',                     // {{10}} الغياب
        'B-202'                  // {{11}} رقم الحافلة للتأكيد
    ];

    $imageUrl = $tunnelDomain . '/assets/images/bus_trip_report.png';
    echo "رابط الصورة: $imageUrl\n";

    $result = $service->sendTemplate($targetPhone, 'bus_trip_report', $params, 'ar_AE', $imageUrl);
    echo "النتيجة: " . ($result ? "نجاح (تم الإرسال لـ Meta)" : "فشل (تفقد سجل laravel.log)") . "\n";
}
