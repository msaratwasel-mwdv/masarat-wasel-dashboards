<?php

use App\Models\User;
use App\Services\NotificationService;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

$parent = User::whereNotNull('fcm_token')->where('fcm_token', '!=', 'fcm_token_test_123')->latest()->first();

if (!$parent || empty($parent->fcm_token)) {
    echo "Wait! No user found in the LOCAL database with a real FCM token.\n\n";
    echo "--> Please open your Flutter app and log in with this Test Parent account:\n";
    echo "    National ID: 74108520\n";
    echo "    Password:    123456\n\n";
    
    echo "Other existing parents (if any):\n";
    $users = User::whereNotNull('national_id')->where('role', 'guardian')->latest()->take(5)->get();
    foreach($users as $user) {
        if (!empty($user->national_id)) {
            echo "- National ID: " . $user->national_id . " | Name: " . $user->name . "\n";
        }
    }
    echo "\nAfter logging in successfully, your phone will register its Notification Token. Then run this script again!\n";
    exit;
}

try {
    $service = app(NotificationService::class);
    
    $service->sendToUser(
        $parent->id,
        'bus_proximity', // نوع الإشعار: اقتراب الحافلة
        'الحافلة تقترب من منزلك (تجربة)',
        'الحافلة على وشك الوصول إلى منزلك، يرجى الاستعداد. (رسالة اختبار)',
        [
            'student_id' => 999, 
            'bus_id' => 999, 
            'time' => now()->toDateTimeString()
        ],
        'نظام النقل'
    );
    
    echo "✅ Bus Approaching Notification (SCRUM-88) sent successfully to '" . $parent->name . "' (National ID: " . $parent->national_id . ")!\n";
    echo "🔔 Check your Flutter app NOW!\n";
    echo "👀 You should see the 'near_me' (Navigation/Arrow) icon.\n";
} catch (\Exception $e) {
    echo "❌ Error sending notification: " . $e->getMessage() . "\n";
}
