<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$school = App\Models\User::where('email', 'school@wasel.com')->first();
if ($school) {
    $school->password = bcrypt('password');
    $school->save();
    echo "Reset password to 'password' for: " . $school->email . "\n";
}
