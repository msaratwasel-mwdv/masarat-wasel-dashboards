<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "--- Final Password Reset & NAT ID Update ---\n";

$password = Hash::make('password');

// 1. Guardian 1 (ID 12)
$g1 = User::find(12);
if ($g1) {
    $g1->update([
        'national_id' => '200300400121', // Set to the one the USER requested for consistency
        'password' => $password
    ]);
    echo "Guardian 1 (ID 12) NAT ID set to 200300400121, Password reset.\n";
}

// 2. Driver 1
$d1 = User::where('national_id', '1111111111')->first();
if ($d1) {
    $d1->update(['password' => $password]);
    echo "Driver 1 password reset.\n";
}

// 3. Driver 001
$d001 = User::where('national_id', '2000000001')->first();
if ($d001) {
    $d001->update(['password' => $password]);
    echo "Driver 001 password reset.\n";
}

// 4. Supervisor 001
$s001 = User::where('national_id', '3000000001')->first();
if ($s001) {
    $s001->update(['password' => $password]);
    echo "Supervisor 001 password reset.\n";
}
