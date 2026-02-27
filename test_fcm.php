<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Services\NotificationService;

// Find ANY user who logged in from Flutter and has a REAL FCM token saved
$parent = User::whereNotNull('fcm_token')->where('fcm_token', '!=', 'fcm_token_test_123')->latest()->first();

if (!$parent) {
    echo "Wait! No user found in the LOCAL database with a real FCM token.\n";
    echo "Here are all existing users you can log in with right now in Flutter:\n";
    $users = User::take(5)->get();
    foreach($users as $user) {
        echo "- National ID: " . $user->national_id . " | Name: " . $user->name . "\n";
    }
    echo "\n--> Please open your Flutter app (which is now pointing to your local server), and log in with any of the National IDs above to save your phone's Notification Token! Then run this script again.\n";
    exit;
}

try {
    $service = app(NotificationService::class);
    
    // Using sendToUser directly to bypass Student/Guardian DB relationship checks for test
    $service->sendToUser(
        $parent->id,
        'bus_boarding_morning',
        'طالبك ركب الباص (تجربة)',
        'ركب الطالب الباص الآن. هذه رسالة تجريبية لاختبار الإشعار من السيرفر المحلي.',
        ['student_id' => 999, 'bus_id' => 999, 'time' => now()->toDateTimeString()],
        'نظام النقل'
    );
    
    echo "Notification sent successfully to '" . $parent->name . "' (National ID: " . $parent->national_id . ")!\n";
    echo "Listen for the ping on your phone! 🔔\n";
} catch (\Exception $e) {
    echo "Error sending notification: " . $e->getMessage() . "\n";
}
