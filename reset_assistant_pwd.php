<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

$userId = 12; // Assistant ID
$newPassword = 'password';

// Update password
$updated = DB::table('users')
    ->where('id', $userId)
    ->update(['password' => Hash::make($newPassword)]);

if ($updated) {
    echo "Successfully updated assistant's password to: '$newPassword'\n";
} else {
    echo "Failed to update password. User might not exist.\n";
}
