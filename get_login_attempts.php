<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$entries = DB::table('telescope_entries')
    ->where('type', 'request')
    ->orderBy('sequence', 'desc')
    ->limit(100)
    ->get();

echo "=== LOGIN ATTEMPTS IN TELESCOPE ===\n";
$found = false;
foreach ($entries as $entry) {
    $content = json_decode($entry->content, true);
    $uri = $content['uri'] ?? '';
    if (str_contains($uri, 'login')) {
        $found = true;
        $reqBody = $content['payload'] ?? [];
        $respBody = $content['response'] ?? [];
        $status = $content['response_status'] ?? 'N/A';
        echo "Time: {$entry->created_at} | Status: $status\n";
        echo "Request payload: " . json_encode($reqBody) . "\n";
        echo "Response: " . json_encode($respBody) . "\n";
        echo "---------------------------------------------------------\n";
    }
}

if (!$found) {
    echo "No login requests found in recent Telescope entries.\n";
}
