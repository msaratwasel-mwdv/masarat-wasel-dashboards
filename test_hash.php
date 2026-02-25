<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Hash;
use App\Models\User;

$phone = '0555555555';
$user = User::where('national_id', '1000200030')->first();

if ($user) {
    echo "User found: " . $user->name . "\n";
    echo "Stored hash: " . $user->password . "\n";
    $check = Hash::check($phone, $user->password);
    echo "Hash check for '$phone': " . ($check ? "PASS" : "FAIL") . "\n";
} else {
    echo "User not found\n";
}
