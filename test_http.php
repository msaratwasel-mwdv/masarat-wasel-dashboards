<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tokens = \Illuminate\Support\Facades\Cache::get('simulator_tokens');
$tokenValue = $tokens['parent'];

$client = new \GuzzleHttp\Client([
    'base_uri' => env('APP_URL', 'http://127.0.0.1:8000'),
    'http_errors' => false
]);

$response = $client->request('GET', '/api/chat/contacts', [
    'headers' => [
        'Authorization' => 'Bearer ' . $tokenValue,
        'Accept' => 'application/json',
    ]
]);

echo "Status Code: " . $response->getStatusCode() . "\n";
echo "Response Body:\n" . $response->getBody() . "\n";
