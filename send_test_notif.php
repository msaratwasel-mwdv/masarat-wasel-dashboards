<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\NotificationService;
use App\Models\User;

$notifService = app(NotificationService::class);
$user = User::where('national_id', '1000200030')->first();

if ($user) {
    if (!$user->fcm_token) {
        die("User has no FCM token in DB. Please log in from the app first.\n");
    }
    echo "Sending notification to " . $user->name . " (ID: " . $user->id . ")\n";
    echo "Token: " . $user->fcm_token . "\n";
    try {
        $notifService->sendToUser(
            userId: $user->id,
            type: 'bus',
            title: 'اختبار من النظام',
            message: 'هذا إشعار تجريبي للتأكد من ربط الفايربيس.',
            data: ['test' => 'true']
        );
        echo "Notification request sent successfully!\n";
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        echo "Trace: " . $e->getTraceAsString() . "\n";
    }
} else {
    echo "User not found\n";
}
