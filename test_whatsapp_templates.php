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

// تحديد نوع الاختبار (status, status_en, report, report_en)
$testType = isset($argv[1]) ? strtolower($argv[1]) : null;

if (! $testType || ! in_array($testType, ['status', 'status_en', 'report', 'report_en'])) {
    echo "\n=== سكربت اختبار قوالب واتساب مسارات واصل ===\n";
    echo "يرجى تحديد نوع الاختبار كالتالي:\n\n";
    echo "  1. اختبار قالب حالة الطالب بالعربي (10 متغيرات):\n";
    echo "     php test_whatsapp_templates.php status\n\n";
    echo "  2. اختبار قالب حالة الطالب بالإنجليزي (10 متغيرات):\n";
    echo "     php test_whatsapp_templates.php status_en\n\n";
    echo "  3. اختبار تقرير الرحلة التفصيلي بالعربي:\n";
    echo "     php test_whatsapp_templates.php report\n\n";
    echo "  4. اختبار تقرير الرحلة التفصيلي بالإنجليزي:\n";
    echo "     php test_whatsapp_templates.php report_en\n\n";
    echo "  5. إرسال لرقم مخصص:\n";
    echo "     php test_whatsapp_templates.php status 967XXXXXXXXX\n";
    echo "===============================================\n\n";
    exit(1);
}

$service = app(\App\Services\WhatsAppService::class);
$tunnelDomain = 'https://ringtones-broader-him-hist.trycloudflare.com';

if ($testType === 'status') {
    echo "جاري اختبار قالب [حالة الطالب بالعربي - student_bus_status]...\n";
    echo "المستلم: $targetPhone\n";

    // المتغيرات الـ 10 بالترتيب
    $params = [
        date('Y/m/d'),                 // {{1}} التاريخ
        'أحمد فضل',                    // {{2}} الطالب
        'جبل المعرفة الدولية',         // {{3}} المدرسة
        'صعد الحافلة ✅',              // {{4}} الحالة
        '06:55 ص',                     // {{5}} وقت وصول الحافلة
        '3 دقائق',                     // {{6}} وقت الانتظار
        '07:00 ص',                     // {{7}} وقت صعود الطالب
        'نجيب الصلوان',                // {{8}} السائق
        'فاطمة علي',                   // {{9}} المشرفة
        '775376507',                   // {{10}} رقم الاتصال
    ];

    $imageUrl = $tunnelDomain.'/assets/images/student_bus_status.png';
    $result = $service->sendTemplate($targetPhone, 'student_bus_status', $params, 'ar', $imageUrl);
    echo 'النتيجة: '.($result ? 'نجاح ✅' : 'فشل ❌')."\n";

} elseif ($testType === 'status_en') {
    echo "جاري اختبار قالب [حالة الطالب بالإنجليزي - student_bus_status_en]...\n";
    echo "المستلم: $targetPhone\n";

    // 10 Parameters in English
    $params = [
        date('Y/m/d'),                         // {{1}} Date
        'Ahmed Fadel',                         // {{2}} Student Name
        'Jabal Al-Maarefa International',      // {{3}} School Name
        'Boarded the bus ✅',                  // {{4}} Status
        '06:55 AM',                            // {{5}} Bus arrival time
        '3 mins',                              // {{6}} Waiting time
        '07:00 AM',                            // {{7}} Boarding time
        'Najeeb Al-Salwan',                    // {{8}} Driver
        'Fatima Ali',                          // {{9}} Supervisor
        '775376507',                           // {{10}} Phone
    ];

    $imageUrl = $tunnelDomain.'/assets/images/student_bus_status.png';
    $result = $service->sendTemplate($targetPhone, 'student_bus_status_en', $params, 'en', $imageUrl);
    echo 'النتيجة: '.($result ? 'نجاح ✅' : 'فشل ❌')."\n";

} elseif ($testType === 'report') {
    echo "جاري اختبار قالب [تقرير الرحلة بالعربي - bus_trip_summary]...\n";
    echo "المستلم: $targetPhone\n";

    $params = [
        'جبل المعرفة الدولية', // {{1}} المدرسة
        date('Y/m/d'),         // {{2}} التاريخ
        'B-202',               // {{3}} رقم الحافلة
        '07:00 ص',             // {{4}} بدء الرحلة
        '08:15 ص',             // {{5}} انتهاء الرحلة
        '00:15 دقيقة',         // {{6}} مدة الانتظار
        '01:15 ساعة',          // {{7}} مدة الرحلة
        '25 كم',               // {{8}} المسافة
        '24',                  // {{9}} الحضور
        '2',                   // {{10}} الغياب
        'B-202',               // {{11}} رقم الحافلة للتأكيد
    ];

    $imageUrl = $tunnelDomain.'/assets/images/bus_trip_report.png';
    $result = $service->sendTemplate($targetPhone, 'bus_trip_summary', $params, 'ar', $imageUrl);
    echo 'النتيجة: '.($result ? 'نجاح ✅' : 'فشل ❌')."\n";

} elseif ($testType === 'report_en') {
    echo "جاري اختبار قالب [تقرير الرحلة بالإنجليزي - bus_trip_summary_en]...\n";
    echo "المستلم: $targetPhone\n";

    $params = [
        'Jabal Al-Maarefa International', // {{1}} School
        date('Y/m/d'),                    // {{2}} Date
        'B-202',                          // {{3}} Bus Number
        '07:00 AM',                       // {{4}} Departure Time
        '08:15 AM',                       // {{5}} Arrival Time
        '15 mins',                        // {{6}} Waiting Duration
        '1 hr 15 mins',                   // {{7}} Trip Duration
        '25 km',                          // {{8}} Distance
        '24',                             // {{9}} Present
        '2',                              // {{10}} Absent
        'B-202',                          // {{11}} Bus Number Confirmation
    ];

    $imageUrl = $tunnelDomain.'/assets/images/bus_trip_report.png';
    $result = $service->sendTemplate($targetPhone, 'bus_trip_summary_en', $params, 'en', $imageUrl);
    echo 'النتيجة: '.($result ? 'نجاح ✅' : 'فشل ❌')."\n";
}
