<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\User;

echo "--- Login Credentials (NAT ID + Password) ---\n";

// 1. Drivers
echo "\n[DRIVERS]\n";
$drivers = User::where('role', 'driver')->get();
foreach ($drivers as $d) {
    echo "Name: {$d->name} | NAT ID: " . ($d->national_id ?? 'N/A') . " | Email: {$d->email}\n";
}

// 2. Supervisors
echo "\n[SUPERVISORS]\n";
$supervisors = User::where('role', 'supervisor')->orWhere('role', 'supervisor')->get();
if ($supervisors->isEmpty()) {
    echo "No users with role='supervisor' found. Checking all roles...\n";
    $roles = User::distinct()->pluck('role');
    echo "Existing roles: " . $roles->implode(', ') . "\n";
} else {
    foreach ($supervisors as $s) {
        echo "Name: {$s->name} | NAT ID: " . ($s->national_id ?? 'N/A') . " | Password: password\n";
    }
}

// 3. Guardians
echo "\n[GUARDIANS]\n";
$guardians = User::where('role', 'guardian')->get();
foreach ($guardians as $g) {
    if ($g->national_id) {
        echo "Name: {$g->name} | NAT ID: {$g->national_id} | Password: password\n";
    }
}
