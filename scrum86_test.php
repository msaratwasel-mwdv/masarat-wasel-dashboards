<?php
/**
 * SCRUM-86 – اختبار متكامل
 * تسجيل ركوب طالب → إشعار FCM لولي الأمر
 *
 * الاستخدام:  http://127.0.0.1:8000/scrum86_test.php
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

echo "<!DOCTYPE html><html dir='rtl' lang='ar'><head>";
echo "<meta charset='UTF-8'><title>SCRUM-86 Integration Test</title>";
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
.btn{display:inline-block;background:#0ea5e9;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;margin:4px;}
.step{display:flex;align-items:flex-start;gap:12px;margin:8px 0;}
.step-num{background:#0ea5e9;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;flex-shrink:0;}
</style></head><body>";

echo "<h1>🚌 SCRUM-86 – اختبار الربط المتكامل</h1>";
echo "<p>ركوب الطالب → إشعار FCM لولي الأمر</p>";

// ═══════════════════════════════════════
// 1. استخراج بيانات قاعدة البيانات
// ═══════════════════════════════════════
echo "<div class='card'><h2>📊 1. بيانات قاعدة البيانات</h2>";

// ولي الأمر
$guardian = DB::table('users')
    ->where('national_id', '1000200030')
    ->first();

if ($guardian) {
    echo "<p class='ok'>✅ ولي الأمر: <strong>{$guardian->name}</strong> (ID: {$guardian->id})</p>";
    echo "<p>FCM Token: <code>" . ($guardian->fcm_token ? substr($guardian->fcm_token, 0, 30).'...' : '<span class="err">غير موجود</span>') . "</code></p>";
} else {
    echo "<p class='err'>❌ ولي الأمر غير موجود (national_id: 1000200030)</p>";
}

// الطلاب المرتبطون بولي الأمر
$guardianRecord = $guardian ? DB::table('guardians')->where('user_id', $guardian->id)->first() : null;
$students = $guardianRecord
    ? DB::table('students')->where('guardian_id', $guardianRecord->id)->get()
    : collect();

echo "<p>عدد الطلاب: <strong>{$students->count()}</strong></p>";

if ($students->count() > 0) {
    echo "<table><tr><th>ID</th><th>الاسم</th><th>الرمز</th><th>الحافلة</th></tr>";
    foreach ($students as $s) {
        $bus = DB::table('bus_students')
            ->join('buses', 'bus_students.bus_id', '=', 'buses.id')
            ->where('bus_students.student_id', $s->id)
            ->where('bus_students.is_active', true)
            ->first();
        $busLabel = $bus ? "#{$bus->bus_number} (ID:{$bus->id})" : '<span class="warn">لا توجد حافلة</span>';
        echo "<tr><td>{$s->id}</td><td>{$s->full_name}</td><td>{$s->student_code}</td><td>$busLabel</td></tr>";
    }
    echo "</table>";
} else {
    echo "<p class='warn'>⚠️ لا يوجد طلاب مرتبطون بولي الأمر.</p>";
}

echo "</div>";

// ═══════════════════════════════════════
// 2. فحص الـ Token في Sanctum
// ═══════════════════════════════════════
echo "<div class='card'><h2>🔑 2. Sanctum Tokens</h2>";
if ($guardian) {
    $tokens = DB::table('personal_access_tokens')
        ->where('tokenable_type', 'App\Models\User')
        ->where('tokenable_id', $guardian->id)
        ->orderByDesc('created_at')
        ->limit(3)
        ->get();

    if ($tokens->count() > 0) {
        echo "<table><tr><th>اسم الجهاز</th><th>تاريخ الإنشاء</th><th>آخر استخدام</th></tr>";
        foreach ($tokens as $t) {
            echo "<tr><td>{$t->name}</td><td>{$t->created_at}</td><td>"
                . ($t->last_used_at ?? '<span class="warn">لم يُستخدم</span>')
                . "</td></tr>";
        }
        echo "</table>";
    } else {
        echo "<p class='warn'>⚠️ لا يوجد Sanctum Token. يجب تسجيل الدخول أولاً.</p>";
    }
}
echo "</div>";

// ═══════════════════════════════════════
// 3. اختبار API حقيقي (Login + Board)
// ═══════════════════════════════════════
echo "<div class='card'><h2>🧪 3. اختبار API متكامل (Curl)</h2>";

$baseUrl = 'http://192.168.8.188:8000';

// 3a. Login
$loginPayload = json_encode([
    'national_id' => '1000200030',
    'phone'       => '0555555555',
    'device_name' => 'scrum86_test_script',
]);

$ch = curl_init("$baseUrl/api/auth/login");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $loginPayload,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
    CURLOPT_TIMEOUT        => 10,
]);
$loginResponse = curl_exec($ch);
$loginStatus   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$loginError    = curl_error($ch);
curl_close($ch);

$loginData = json_decode($loginResponse, true);

echo "<div class='step'><div class='step-num'>1</div><div>";
echo "<strong>POST /api/auth/login</strong> → HTTP $loginStatus<br>";
if ($loginStatus === 200 && isset($loginData['token'])) {
    $bearerToken = $loginData['token'];
    echo "<span class='ok'>✅ تسجيل الدخول نجح! Token: " . substr($bearerToken, 0, 20) . "...</span>";
} else {
    echo "<span class='err'>❌ فشل تسجيل الدخول</span><br>";
    echo "<pre>" . htmlspecialchars($loginError ?: $loginResponse) . "</pre>";
    $bearerToken = null;
}
echo "</div></div>";

if ($bearerToken) {
    // 3b. جلب طالب + حافلة
    $student = $students->first();
    $bus = $student ? DB::table('bus_students')
        ->join('buses', 'bus_students.bus_id', '=', 'buses.id')
        ->where('bus_students.student_id', $student->id)
        ->where('bus_students.is_active', true)
        ->first() : null;

    if ($student && $bus) {
        // 3c. Board API
        $boardPayload = json_encode([
            'student_id' => $student->id,
            'direction'  => 'to_school',
            'latitude'   => 24.7136,
            'longitude'  => 46.6753,
        ]);

        $ch = curl_init("$baseUrl/api/bus/{$bus->id}/board");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $boardPayload,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Accept: application/json',
                "Authorization: Bearer $bearerToken",
            ],
            CURLOPT_TIMEOUT => 15,
        ]);
        $boardResponse = curl_exec($ch);
        $boardStatus   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $boardError    = curl_error($ch);
        curl_close($ch);

        $boardData = json_decode($boardResponse, true);

        echo "<div class='step'><div class='step-num'>2</div><div>";
        echo "<strong>POST /api/bus/{$bus->id}/board</strong> (طالب: {$student->full_name}) → HTTP $boardStatus<br>";
        if ($boardStatus === 201) {
            echo "<span class='ok'>✅ تم تسجيل الركوب بنجاح! Log ID: " . ($boardData['log']['id'] ?? '?') . "</span>";
            echo "<br><span class='ok'>✅ يجب أن يصل إشعار FCM لولي الأمر الآن 📱</span>";
        } else {
            echo "<span class='err'>❌ فشل تسجيل الركوب</span>";
            echo "<pre>" . htmlspecialchars($boardError ?: $boardResponse) . "</pre>";
        }
        echo "</div></div>";

        // 3d. تحقق من الإشعار في قاعدة البيانات
        sleep(1);
        echo "<div class='step'><div class='step-num'>3</div><div>";
        echo "<strong>التحقق من الإشعار في قاعدة البيانات</strong><br>";
        $latestNotif = DB::table('notifications')
            ->where('user_id', $guardian->id)
            ->orderByDesc('created_at')
            ->first();

        if ($latestNotif && strtotime($latestNotif->created_at) > (time() - 30)) {
            echo "<span class='ok'>✅ إشعار جديد موجود في DB!</span><br>";
            echo "<table><tr><th>العنوان</th><th>الرسالة</th><th>النوع</th><th>الوقت</th></tr>";
            echo "<tr><td>{$latestNotif->title}</td><td>{$latestNotif->message}</td>"
                . "<td>{$latestNotif->type}</td><td>{$latestNotif->created_at}</td></tr>";
            echo "</table>";
        } else {
            echo "<span class='warn'>⚠️ لم يُضاف إشعار جديد (آخر إشعار: " . ($latestNotif->created_at ?? 'لا يوجد') . ")</span>";
        }
        echo "</div></div>";

        // 3e. جلب الإشعارات عبر API (كما يفعل Flutter)
        echo "<div class='step'><div class='step-num'>4</div><div>";
        echo "<strong>GET /api/guardian/notifications (كما يفعل Flutter)</strong><br>";
        $ch = curl_init("$baseUrl/api/guardian/notifications");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Accept: application/json',
                "Authorization: Bearer $bearerToken",
            ],
            CURLOPT_TIMEOUT => 10,
        ]);
        $notifResponse = curl_exec($ch);
        $notifStatus   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $notifData = json_decode($notifResponse, true);

        if ($notifStatus === 200) {
            $notifCount = count($notifData['notifications']['data'] ?? []);
            $unread = $notifData['unread_count'] ?? 0;
            echo "<span class='ok'>✅ HTTP $notifStatus – {$notifCount} إشعار (غير مقروء: {$unread})</span><br>";
            if ($notifCount > 0) {
                $first = $notifData['notifications']['data'][0];
                echo "<table><tr><th>العنوان</th><th>الرسالة</th><th>النوع</th></tr>";
                echo "<tr><td>{$first['title']}</td><td>{$first['message']}</td><td>{$first['type']}</td></tr>";
                echo "</table>";
            }
        } else {
            echo "<span class='err'>❌ HTTP $notifStatus</span><br>";
            echo "<pre>" . htmlspecialchars($notifResponse) . "</pre>";
        }
        echo "</div></div>";

    } else {
        echo "<p class='err'>❌ لا يوجد طالب أو حافلة مربوطة بولي الأمر. يرجى إضافة بيانات في لوحة التحكم.</p>";
    }
}

echo "</div>";

// ═══════════════════════════════════════
// 4. آخر الإشعارات في قاعدة البيانات
// ═══════════════════════════════════════
echo "<div class='card'><h2>🔔 4. آخر 5 إشعارات في قاعدة البيانات</h2>";
$notifications = DB::table('notifications')
    ->orderByDesc('created_at')
    ->limit(5)
    ->get();

if ($notifications->count()) {
    echo "<table><tr><th>ID</th><th>المستخدم</th><th>العنوان</th><th>النوع</th><th>الوقت</th></tr>";
    foreach ($notifications as $n) {
        echo "<tr><td>{$n->id}</td><td>{$n->user_id}</td><td>{$n->title}</td><td>{$n->type}</td><td>{$n->created_at}</td></tr>";
    }
    echo "</table>";
} else {
    echo "<p class='warn'>لا توجد إشعارات في قاعدة البيانات.</p>";
}
echo "</div>";

// ═══════════════════════════════════════
// 5. ملخص الفحوصات + الإجراءات المطلوبة
// ═══════════════════════════════════════
echo "<div class='card'><h2>📋 5. ملخص وإجراءات مطلوبة</h2>";

$issues = [];

if (!$guardian) $issues[] = "❌ لا يوجد مستخدم بـ national_id = 1000200030";
if ($guardian && !$guardian->fcm_token) $issues[] = "⚠️ ولي الأمر ليس لديه FCM Token — سجّل الدخول في التطبيق أولاً";
if ($students->count() === 0) $issues[] = "❌ لا يوجد طلاب مرتبطون بولي الأمر";

if (count($issues) === 0) {
    echo "<p class='ok'>✅ جميع البيانات متكاملة. النظام جاهز للربط الكامل.</p>";
} else {
    echo "<ul>";
    foreach ($issues as $issue) {
        echo "<li class='warn'>$issue</li>";
    }
    echo "</ul>";
}

echo "</div>";

echo "</body></html>";
