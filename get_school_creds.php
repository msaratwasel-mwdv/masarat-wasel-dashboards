<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$schoolUser = App\Models\User::where('role', 'school')->first();
echo "School User: " . $schoolUser->email . " / Name: " . $schoolUser->name . "\n";
// passwords are encrypted, so we usually assume 'password' or '12345678' for local test db, 
// let's reset the password to 'password' just to be 100% sure we can login.
$schoolUser->password = bcrypt('password');
$schoolUser->save();
echo "Password reset to: password\n";
