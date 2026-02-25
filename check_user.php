<?php
use App\Models\User;
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = User::where('national_id', '1000200030')->first();
if ($u) {
    echo "--- USER DATA ---\n";
    echo "ID: " . $u->id . "\n";
    echo "Name: " . $u->name . "\n";
    echo "National ID: [" . $u->national_id . "]\n";
    echo "Phone (Password): [" . $u->phone . "]\n";
    echo "Role: " . $u->role . "\n";
    echo "Is Active: " . ($u->is_active ? 'Yes' : 'No') . "\n";
    
    // Test password match
    $testPhone = '0555555555';
    $match = password_verify($testPhone, $u->password);
    echo "Password Match for '$testPhone': " . ($match ? 'YES' : 'NO') . "\n";
} else {
    echo "User not found!\n";
}
