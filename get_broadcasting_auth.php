<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$entries = DB::table('telescope_entries')
    ->where('type', 'request')
    ->where('content', 'LIKE', '%broadcasting/auth%')
    ->orderBy('sequence', 'desc')
    ->limit(10)
    ->get();

echo "=== BROADCASTING AUTH ATTEMPTS ===\n";
if ($entries->isEmpty()) {
    echo "No broadcasting/auth requests found.\n";
} else {
    foreach ($entries as $entry) {
        $content = json_decode($entry->content, true);
        $status = $content['response_status'] ?? 'N/A';
        $payload = $content['payload'] ?? [];
        echo "Time: {$entry->created_at} | Status: $status | Payload: " . json_encode($payload) . "\n";
    }
}
