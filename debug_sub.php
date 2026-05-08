<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Subscription;
use App\Models\Plan;
use App\Models\User;

$sub = Subscription::with(['school.users', 'plan'])->where('status', 'pending_approval')->first();

if (!$sub) {
    echo "No pending sub found\n";
    exit;
}

echo "Sub ID: " . $sub->id . "\n";
echo "Plan Name: " . $sub->plan->name . "\n";
echo "Max Buses: " . var_export($sub->plan->max_buses, true) . "\n";

$user = $sub->school->users->first();
if ($user) {
    echo "User ID: " . $user->id . "\n";
    echo "First Name AR: " . var_export($user->first_name_ar, true) . "\n";
    echo "Email: " . $user->email . "\n";
    echo "Appended Name: " . $user->name . "\n";
    echo "Name EN: " . $user->name_en . "\n";
} else {
    echo "No user linked to school\n";
}
