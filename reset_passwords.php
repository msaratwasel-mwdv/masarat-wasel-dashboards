<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "--- Resetting Test Passwords & Finding NAT IDs ---\n";

// 1. Find Guardian 1 (ID 12) and its NAT ID
$g1 = User::find(12);
if ($g1) {
    echo "Guardian 1 (ID 12) actual NAT ID: " . ($g1->national_id ?? 'NULL') . "\n";
    // If NAT ID is null, set it to the one the user expects for training
    if (!$g1->national_id) {
        $g1->update(['national_id' => '200300400121']);
        echo "   -> Set NAT ID to 200300400121\n";
    }
}

// 2. Reset passwords for test users
$targets = [
    '1111111111', // Driver 1
    '2000000001', // Driver 001
    '200300400121', // Guardian 1 (now set)
    '3000000001', // Supervisor 001
];

foreach ($targets as $natId) {
    $user = User::where('national_id', $natId)->first();
    if ($user) {
        $user->password = Hash::make('password');
        $user->save();
        echo "Password RESET for: {$user->name} (NAT: {$natId})\n";
    } else {
        echo "User with NAT {$natId} NOT FOUND to reset password.\n";
    }
}
