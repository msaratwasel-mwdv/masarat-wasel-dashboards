<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::find(9);
if ($user) {
    echo "Before update:\n";
    print_r($user->only(['first_name_en', 'second_name_en', 'third_name_en', 'last_name_en']));
    
    $user->update([
        'first_name_en' => 'Othman',
        'second_name_en' => 'Al-Laith',
        'third_name_en' => 'Raji',
        'last_name_en' => 'Al-Shuhail'
    ]);
    
    $user->refresh();
    echo "After update:\n";
    print_r($user->only(['first_name_en', 'second_name_en', 'third_name_en', 'last_name_en']));
    echo "Full English Name: " . $user->name_en . "\n";
} else {
    echo "User 9 not found\n";
}
