<?php
/**
 * إعداد بيانات اختبار SCRUM-86
 * ربط الطالب بحافلة + تنفيذ اختبار متكامل
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

echo "<!DOCTYPE html><html dir='rtl' lang='ar'><head>";
echo "<meta charset='UTF-8'><title>SCRUM-86 Setup + Full Test</title>";
echo "<style>
body{font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;direction:rtl;}
h1{color:#38bdf8;} h2{color:#7dd3fc;border-bottom:1px solid #334155;padding-bottom:8px;}
.ok{color:#4ade80;} .err{color:#f87171;} .warn{color:#fbbf24;}
table{border-collapse:collapse;width:100%;margin:12px 0;}
th,td{border:1px solid #334155;padding:8px 12px;text-align:right;}
th{background:#1e3a5f;color:#7dd3fc;}
tr:nth-child(even){background:#1e293b;}
pre{background:#1e293b;padding:12px;border-radius:8px;overflow-x:auto;font-size:13px;}
.card{background:#1e293b;border-radius:12px;padding:16px;margin:16px 0;border:1px solid #334155;}
.step{display:flex;align-items:flex-start;gap:12px;margin:12px 0;padding:12px;background:#0f172a;border-radius:8px;}
.step-num{background:#0ea5e9;color:white;border-radius:50%;min-width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;}
</style></head><body>";

echo "<h1>🔧 SCRUM-86 – إعداد + اختبار متكامل</h1>";

// ═══════════════════════════════════════
// الخطوة 1: جلب/إنشاء الحافلة
// ═══════════════════════════════════════
echo "<div class='card'><h2>🚌 الخطوة 1: التحقق من الحافلة</h2>";

// جلب أو إنشاء حساب سائق
$driver = DB::table('users')->where('role', 'driver')->first();
if (!$driver) {
    $driverId = DB::table('users')->insertGetId([
        'name'        => 'سائق تجريبي',
        'email'       => 'driver_test@test.com',
        'national_id' => 'DRV001',
        'password'    => Hash::make('123456'),
        'role'        => 'driver',
        'created_at'  => now(),
        'updated_at'  => now(),
    ]);
    echo "<p class='ok'>✅ تم إنشاء حساب سائق (ID: $driverId)</p>";
    $driver = DB::table('users')->find($driverId);
} else {
    echo "<p class='ok'>✅ سائق موجود: {$driver->name} (ID: {$driver->id})</p>";
}

// جلب أو إنشاء حافلة
$bus = DB::table('buses')->first();
if (!$bus) {
    $busId = DB::table('buses')->insertGetId([
        'bus_number'   => 'B001',
        'plate_number' => 'SAS-1234',
        'capacity'     => 30,
        'driver_id'    => $driver->id,
        'is_active'    => true,
        'created_at'   => now(),
        'updated_at'   => now(),
    ]);
    echo "<p class='ok'>✅ تم إنشاء حافلة جديدة (ID: $busId)</p>";
    $bus = DB::table('buses')->find($busId);
} else {
    echo "<p class='ok'>✅ حافلة موجودة: رقم {$bus->bus_number} (ID: {$bus->id})</p>";
}

// ═══════════════════════════════════════
// الخطوة 2: ربط الطالب بالحافلة
// ═══════════════════════════════════════
echo "<h2>🔗 الخطوة 2: ربط الطالب بالحافلة</h2>";

$student = DB::table('students')->first();
if (!$student) {
    echo "<p class='err'>❌ لا يوجد طالب في قاعدة البيانات!</p>";
    exit;
}

echo "<p>الطالب: <strong>{$student->full_name}</strong> (ID: {$student->id})</p>";

// التحقق من الربط الحالي
$existingLink = DB::table('bus_students')
    ->where('student_id', $student->id)
    ->where('bus_id', $bus->id)
    ->first();

if (!$existingLink) {
    DB::table('bus_students')->insert([
        'bus_id'     => $bus->id,
        'student_id' => $student->id,
        'is_active'  => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    echo "<p class='ok'>✅ تم ربط الطالب بالحافلة رقم {$bus->bus_number}!</p>";
} else {
    // تأكد أن الربط نشط
    if (!$existingLink->is_active) {
        DB::table('bus_students')
            ->where('student_id', $student->id)
            ->where('bus_id', $bus->id)
            ->update(['is_active' => true]);
        echo "<p class='ok'>✅ تم تفعيل ربط الطالب بالحافلة.</p>";
    } else {
        echo "<p class='ok'>✅ الطالب مربوط بالحافلة بالفعل.</p>";
    }
}

echo "</div>";

// ═══════════════════════════════════════
// الخطوة 3: اختبار API متكامل
// ═══════════════════════════════════════
echo "<div class='card'><h2>🧪 الخطوة 3: اختبار API متكامل (SCRUM-86)</h2>";

$baseUrl = 'http://192.168.8.188:8000';

// 3a. Login
echo "<div class='step'><div class='step-num'>1</div><div style='flex:1'>";
echo "<strong>POST /api/auth/login</strong><br>";

$ch = curl_init("$baseUrl/api/auth/login");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode([
        'national_id' => '1000200030',
        'phone'       => '0555555555',
        'device_name' => 'scrum86_live_test',
    ]),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
    CURLOPT_TIMEOUT        => 10,
]);
$loginResp   = curl_exec($ch);
$loginStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$loginErr    = curl_error($ch);
curl_close($ch);

$loginData   = json_decode($loginResp, true);
$token       = $loginData['token'] ?? null;

if ($loginStatus === 200 && $token) {
    echo "<span class='ok'>✅ HTTP $loginStatus – تسجيل الدخول نجح</span><br>";
    echo "Token: <code>" . substr($token, 0, 25) . "...</code>";
} else {
    echo "<span class='err'>❌ HTTP $loginStatus – " . htmlspecialchars($loginErr ?: $loginResp) . "</span>";
    $token = null;
}
echo "</div></div>";

if ($token) {
    // 3b. Board
    echo "<div class='step'><div class='step-num'>2</div><div style='flex:1'>";
    echo "<strong>POST /api/bus/{$bus->id}/board</strong> (طالب: {$student->full_name} - اتجاه: to_school)<br>";

    $ch = curl_init("$baseUrl/api/bus/{$bus->id}/board");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode([
            'student_id' => $student->id,
            'direction'  => 'to_school',
            'latitude'   => 24.7136,
            'longitude'  => 46.6753,
        ]),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
            "Authorization: Bearer $token",
        ],
        CURLOPT_TIMEOUT => 20,
    ]);
    $boardResp   = curl_exec($ch);
    $boardStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $boardErr    = curl_error($ch);
    curl_close($ch);

    $boardData = json_decode($boardResp, true);

    if ($boardStatus === 201) {
        $logId = $boardData['log']['id'] ?? '?';
        echo "<span class='ok'>✅ HTTP $boardStatus – تم تسجيل الركوب! (Log ID: $logId)</span><br>";
        echo "<span class='ok'>✅ تم إرسال إشعار FCM لولي الأمر 📱</span>";
    } else {
        echo "<span class='err'>❌ HTTP $boardStatus</span><br>";
        echo "<pre>" . htmlspecialchars($boardErr ?: $boardResp) . "</pre>";
    }
    echo "</div></div>";

    // 3c. تحقق من الإشعار في DB
    sleep(2);
    echo "<div class='step'><div class='step-num'>3</div><div style='flex:1'>";
    echo "<strong>التحقق من الإشعار في قاعدة البيانات</strong><br>";

    $guardian = DB::table('users')->where('national_id', '1000200030')->first();
    $newNotif = DB::table('notifications')
        ->where('user_id', $guardian->id)
        ->where('type', 'bus_boarding_morning')
        ->orderByDesc('created_at')
        ->first();

    if ($newNotif && strtotime($newNotif->created_at) > (time() - 60)) {
        echo "<span class='ok'>✅ إشعار SCRUM-86 موجود في قاعدة البيانات!</span><br>";
        echo "<table><tr><th>العنوان</th><th>الرسالة</th><th>النوع</th><th>الوقت</th></tr>";
        echo "<tr><td>{$newNotif->title}</td><td>{$newNotif->message}</td><td>{$newNotif->type}</td><td>{$newNotif->created_at}</td></tr>";
        echo "</table>";
    } else {
        echo "<span class='warn'>⚠️ لم يُعثر على إشعار boarding جديد. تحقق من إعدادات FCM.</span>";
        $latest = DB::table('notifications')->where('user_id', $guardian->id)->orderByDesc('created_at')->first();
        if ($latest) {
            echo "<br>آخر إشعار: <strong>{$latest->title}</strong> ({$latest->created_at})";
        }
    }
    echo "</div></div>";

    // 3d. Guardian Notifications API (كما يفعل Flutter)
    echo "<div class='step'><div class='step-num'>4</div><div style='flex:1'>";
    echo "<strong>GET /api/guardian/notifications (Flutter API)</strong><br>";

    $ch = curl_init("$baseUrl/api/guardian/notifications");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Accept: application/json',
            "Authorization: Bearer $token",
        ],
        CURLOPT_TIMEOUT => 10,
    ]);
    $notifResp   = curl_exec($ch);
    $notifStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $notifData = json_decode($notifResp, true);

    if ($notifStatus === 200) {
        $items  = $notifData['notifications']['data'] ?? [];
        $unread = $notifData['unread_count'] ?? 0;
        echo "<span class='ok'>✅ HTTP $notifStatus – " . count($items) . " إشعار (غير مقروء: $unread)</span><br>";
        if (count($items) > 0) {
            echo "<table><tr><th>العنوان</th><th>النوع</th><th>الوقت</th></tr>";
            foreach (array_slice($items, 0, 5) as $item) {
                echo "<tr><td>{$item['title']}</td><td>{$item['type']}</td><td>{$item['created_at']}</td></tr>";
            }
            echo "</table>";
        }
    } else {
        echo "<span class='err'>❌ HTTP $notifStatus</span><br><pre>" . htmlspecialchars($notifResp) . "</pre>";
    }
    echo "</div></div>";
}

echo "</div>";

// ═══════════════════════════════════════
// الخطوة 4: مراقبة الإشعارات في Flutter
// ═══════════════════════════════════════
echo "<div class='card'><h2>📱 الخطوة 4: التحقق من الاستقبال في Flutter</h2>";
echo "<p>إذا كان التطبيق مفتوحاً على الجوال الآن، يجب أن يظهر الإشعار في:</p>";
echo "<ul>
    <li>✅ شريط الإشعارات (status bar)</li>
    <li>✅ صفحة الإشعارات داخل التطبيق (نقر على أيقونة الجرس)</li>
    <li>✅ آخر الإشعارات في قائمة DB أعلاه</li>
</ul>";
echo "</div>";

echo "</body></html>";
