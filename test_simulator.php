<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tokens = \Illuminate\Support\Facades\Cache::get('simulator_tokens');
$tokenValue = explode('|', $tokens['parent'])[1];
echo "Parent Token: " . $tokenValue . "\n";

// Find the personal access token in db
$pat = \Laravel\Sanctum\PersonalAccessToken::findToken($tokenValue);

if ($pat) {
    echo "Token found in DB for User ID: " . $pat->tokenable_id . "\n";
} else {
    echo "TOKEN NOT FOUND IN DB!\n";
}
