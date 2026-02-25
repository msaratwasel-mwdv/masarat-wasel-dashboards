<?php
ob_start();
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tokens = \Illuminate\Support\Facades\Cache::get('simulator_tokens');

echo "\n";
echo "╔═══════════════════════════════════════════════════════════════╗\n";
echo "║  🔑 التوكنات المتاحة للاختبار                                ║\n";
echo "╠═══════════════════════════════════════════════════════════════╣\n";
echo "║ ولي الأمر (أبو أحمد):  " . $tokens['parent'] . "\n";
echo "║ سائق باص A (خالد):     " . $tokens['driverA'] . "\n";
echo "║ مشرفة باص A (نورة):    " . $tokens['superA'] . "\n";
echo "║ سائق باص B (سعد):      " . $tokens['driverB'] . "\n";
echo "║ مشرفة باص B (هند):     " . $tokens['superB'] . "\n";
echo "║ سائق باص C (فيصل):     " . $tokens['driverC'] . "\n";
echo "║ مشرفة باص C (ريم):     " . $tokens['superC'] . "\n";
echo "╚═══════════════════════════════════════════════════════════════╝\n";

echo "\n\n";
echo "══════════════════════════════════════════════════════════════════\n";
echo "  📱 ① ماذا يرى ولي الأمر (أبو أحمد) في جهات الاتصال؟\n";
echo "══════════════════════════════════════════════════════════════════\n\n";

$parentUser = \App\Models\User::find($tokens['parent_id']);
$chatController = app()->make(\App\Http\Controllers\Api\ChatController::class);

$request = \Illuminate\Http\Request::create('/api/chat/contacts', 'GET');
$request->setUserResolver(fn() => $parentUser);
$res = json_decode($chatController->getContacts($request)->getContent(), true);

if ($res['success'] && !empty($res['data'])) {
    foreach ($res['data'] as $i => $contact) {
        $roleLabel = match ($contact['role']) {
            'driver' => '🚐 سائق',
            'supervisor' => '👩‍💼 مشرفة',
            default => '👤 ' . $contact['role']
        };
        echo "  " . ($i + 1) . ". {$roleLabel}: {$contact['name']}\n";
        echo "     📋 {$contact['chat_description']}\n\n";
    }
} else {
    echo "  ❌ لا توجد جهات اتصال\n";
}

echo "\n\n";
echo "══════════════════════════════════════════════════════════════════\n";
echo "  📱 ② ماذا يرى سائق باص A (الكابتن خالد) في جهات الاتصال؟\n";
echo "     (هذا الباص فيه أحمد + فاطمة = أبناء نفس الأب)\n";
echo "══════════════════════════════════════════════════════════════════\n\n";

$driverAUser = \App\Models\User::find($tokens['driver_id']);
$request2 = \Illuminate\Http\Request::create('/api/chat/contacts', 'GET');
$request2->setUserResolver(fn() => $driverAUser);
$res2 = json_decode($chatController->getContacts($request2)->getContent(), true);

if ($res2['success'] && !empty($res2['data'])) {
    foreach ($res2['data'] as $i => $contact) {
        echo "  " . ($i + 1) . ". 👤 {$contact['name']}\n";
        echo "     📋 {$contact['chat_description']}\n\n";
    }
} else {
    echo "  ❌ لا توجد جهات اتصال\n";
}

echo "\n\n";
echo "══════════════════════════════════════════════════════════════════\n";
echo "  📱 ③ ماذا يرى سائق باص B (الكابتن سعد) في جهات الاتصال؟\n";
echo "     (هذا الباص فيه محمد فقط)\n";
echo "══════════════════════════════════════════════════════════════════\n\n";

$driverBUser = \Laravel\Sanctum\PersonalAccessToken::findToken(explode('|', $tokens['driverB'])[1])?->tokenable;
$request3 = \Illuminate\Http\Request::create('/api/chat/contacts', 'GET');
$request3->setUserResolver(fn() => $driverBUser);
$res3 = json_decode($chatController->getContacts($request3)->getContent(), true);

if ($res3['success'] && !empty($res3['data'])) {
    foreach ($res3['data'] as $i => $contact) {
        echo "  " . ($i + 1) . ". 👤 {$contact['name']}\n";
        echo "     📋 {$contact['chat_description']}\n\n";
    }
} else {
    echo "  ❌ لا توجد جهات اتصال\n";
}

echo "\n✅ انتهت المحاكاة بنجاح!\n";
$output = ob_get_clean();
file_put_contents('scenario_output.txt', $output);
echo $output;
