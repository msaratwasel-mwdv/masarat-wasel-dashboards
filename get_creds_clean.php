<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "========================================\n";
echo "        TEST CREDENTIALS READY          \n";
echo "========================================\n\n";

echo "PASSWORD FOR ALL ACCOUNTS: password\n\n";

$roles = [
    'driver' => 'DRIVERS (msaratwasel-services)',
    'parent' => 'PARENTS (msaratwasel_parent)',
    'supervisor' => 'SUPERVISORS',
    'admin' => 'ADMIN',
    'teacher' => 'TEACHERS',
];

foreach ($roles as $role => $title) {
    echo "--- $title ---\n";
    $users = App\Models\User::where('role', $role)->limit(3)->get();
    if ($users->isEmpty()) {
        echo "No accounts found for this role.\n";
    }
    foreach ($users as $u) {
        echo str_pad("Name: {$u->name}", 25) . " | National ID: {$u->national_id}" . ($u->phone_number ? " | Phone: {$u->phone_number}" : "") . "\n";
    }
    echo "\n";
}
