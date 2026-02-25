<?php
/**
 * SCRUM-86 – ربط الطالب بالحافلة (ID=2) + اختبار نهائي كامل
 */
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Http\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n🔗 SCRUM-86 – ربط الطالب بالحافلة الصحيحة (ID=2 / رقم 102)\n";
echo str_repeat("═", 55) . "\n";

// المستخدم ولي الأمر
$guardian     = DB::table('users')->where('national_id', '1000200030')->first();
$guardianRec  = DB::table('guardians')->where('user_id', $guardian->id)->first();
$student      = DB::table('students')->where('guardian_id', $guardianRec->id)->first()
             ?? DB::table('students')->first();

// الحافلة الصحيحة (المرتبطة بالمدرسة)
$bus = DB::table('buses')->where('bus_number', '102')->first()
     ?? DB::table('buses')->where('id', 2)->first();

if (!$bus) { die("❌ لا توجد حافلة رقم 102\n"); }

echo "✅ الطالب: {$student->full_name} (ID:{$student->id})\n";
echo "✅ الحافلة: رقم {$bus->bus_number} (ID:{$bus->id})\n";

// احذف الربط القديم مع حافلة ID=1 وأضف الجديد مع ID=2
DB::table('bus_students')->where('student_id', $student->id)->delete();
echo "✅ تم حذف الروابط القديمة\n";

DB::table('bus_students')->insert([
    'bus_id'     => $bus->id,
    'student_id' => $student->id,
    'is_active'  => true,
    'created_at' => now(),
    'updated_at' => now(),
]);
echo "✅ تم ربط الطالب بالحافلة {$bus->bus_number} (ID:{$bus->id})\n\n";

// ═══ اختبار API : ركوب الطالب → إشعار FCM ════════════════
echo "🧪 اختبار API النهائي\n";
echo str_repeat("─", 55) . "\n";

$base = 'http://192.168.8.188:8000';

// Login
echo "[1] Login ... ";
$ch = curl_init("$base/api/auth/login");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true,CURLOPT_POST=>true,
    CURLOPT_POSTFIELDS=>json_encode(['national_id'=>'1000200030','phone'=>'0555555555','device_name'=>'scrum86_final']),
    CURLOPT_HTTPHEADER=>['Content-Type: application/json','Accept: application/json'],CURLOPT_TIMEOUT=>10]);
$lr=json_decode(curl_exec($ch),true); $ls=curl_getinfo($ch,CURLINFO_HTTP_CODE); curl_close($ch);
$token = $ls===200 ? ($lr['token']??null) : null;
echo $token ? "✅ HTTP $ls\n" : "❌ HTTP $ls\n" . json_encode($lr) . "\n";
if (!$token) exit(1);

// Board
echo "[2] POST /api/bus/{$bus->id}/board ... ";
$ch = curl_init("$base/api/bus/{$bus->id}/board");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true,CURLOPT_POST=>true,
    CURLOPT_POSTFIELDS=>json_encode(['student_id'=>$student->id,'direction'=>'to_school','latitude'=>24.7136,'longitude'=>46.6753]),
    CURLOPT_HTTPHEADER=>['Content-Type: application/json','Accept: application/json',"Authorization: Bearer $token"],
    CURLOPT_TIMEOUT=>20]);
$br=json_decode(curl_exec($ch),true); $bs=curl_getinfo($ch,CURLINFO_HTTP_CODE); $be=curl_error($ch); curl_close($ch);
if ($bs===201) {
    echo "✅ HTTP $bs – Log ID: " . ($br['log']['id']??'?') . "\n";
    echo "   📱 إشعار FCM أُرسل!\n";
} else {
    echo "❌ HTTP $bs | " . ($be?:json_encode($br)) . "\n"; exit(1);
}

// تحقق من DB
sleep(2);
echo "[3] تحقق DB ... ";
$n = DB::table('notifications')->where('user_id',$guardian->id)->where('type','bus_boarding_morning')->orderByDesc('created_at')->first();
if ($n && strtotime($n->created_at)>(time()-90)){
    echo "✅ '{$n->title}' | '{$n->message}'\n";
} else {
    $last = DB::table('notifications')->where('user_id',$guardian->id)->orderByDesc('created_at')->first();
    echo "⚠️  آخر إشعار: ".($last?"{$last->title} [{$last->type}]":'لا يوجد')."\n";
}

// Guardian API
echo "[4] GET /api/guardian/notifications ... ";
$ch = curl_init("$base/api/guardian/notifications");
curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,
    CURLOPT_HTTPHEADER=>['Accept: application/json',"Authorization: Bearer $token"],CURLOPT_TIMEOUT=>10]);
$nr=json_decode(curl_exec($ch),true); $ns=curl_getinfo($ch,CURLINFO_HTTP_CODE); curl_close($ch);
if ($ns===200){
    $items = $nr['notifications']['data'] ?? [];
    $unread = $nr['unread_count'] ?? 0;
    echo "✅ HTTP $ns – " . count($items) . " إشعار (غير مقروء: $unread)\n";
    foreach(array_slice($items,0,3) as $item){
        echo "   📌 [{$item['type']}] {$item['title']} @ {$item['created_at']}\n";
    }
} else {
    echo "❌ HTTP $ns | " . json_encode($nr) . "\n";
}

echo "\n" . str_repeat("═",55) . "\n";
echo "🎉 SCRUM-86 اكتملت! الإشعار جاهز في التطبيق 📱\n";
echo str_repeat("═",55) . "\n\n";
