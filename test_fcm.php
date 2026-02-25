<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$user = User::where('national_id', '1000200030')->first();

if ($user) {
    echo "User: " . $user->name . "\n";
    echo "FCM Token: [" . ($user->fcm_token ?: 'NULL') . "]\n";
} else {
    echo "User not found\n";
}
