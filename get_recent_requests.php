<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$entries = DB::table('telescope_entries')
    ->where('type', 'request')
    ->orderBy('sequence', 'desc')
    ->limit(30)
    ->get();

echo "=== RECENT HTTP REQUESTS ===\n";
foreach ($entries as $entry) {
    $content = json_decode($entry->content, true);
    $uri = $content['uri'] ?? 'N/A';
    $method = $content['method'] ?? 'N/A';
    $status = $content['response_status'] ?? 'N/A';
    echo "Time: {$entry->created_at} | $method $uri | Status: $status\n";
}
