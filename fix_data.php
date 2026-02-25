<?php
use App\Models\User;
use App\Models\Guardian;
use Illuminate\Support\Facades\Hash;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$nationalId = '1000200030';
$phone = '0555555555';

$user = User::where('national_id', $nationalId)->first();
if ($user) {
    $user->update([
        'phone' => $phone,
        'password' => Hash::make($phone),
    ]);
    echo "User $nationalId updated successfully.\n";
} else {
    echo "User $nationalId not found.\n";
}

$guardian = Guardian::where('national_id', $nationalId)->first();
if ($guardian) {
    $guardian->update([
        'phone' => $phone,
    ]);
    echo "Guardian $nationalId updated successfully.\n";
} else {
    echo "Guardian $nationalId not found.\n";
}
