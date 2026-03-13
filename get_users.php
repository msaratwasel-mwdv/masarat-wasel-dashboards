<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$users = App\Models\User::all();
echo "Available users:\n";
foreach($users as $user) {
    echo "ID: " . $user->id . ", Name: " . $user->name . ", Email: " . $user->email . ", Role: " . ($user->role ?? $user->user_type ?? 'N/A') . "\n";
}

$admin = App\Models\User::where('email', 'like', '%admin%')->orWhere('email', 'like', '%school%')->first();
if ($admin) {
    $admin->password = bcrypt('password');
    $admin->save();
    echo "\nReset password to 'password' for: " . $admin->email . "\n";
}
