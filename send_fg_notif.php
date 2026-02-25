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
    echo "Sending FOREGROUND notification to " . $user->name . "\n";
    $notifService->sendToUser(
        userId: $user->id,
        type: 'bus',
        title: 'إشعار في المتصفح',
        message: 'تم وصول الحافلة الآن!',
        data: ['bus_id' => '1']
    );
    echo "Sent!\n";
} else {
    echo "User not found\n";
}
