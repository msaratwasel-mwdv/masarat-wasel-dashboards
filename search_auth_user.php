<?php
// search_auth_user.php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$entries = DB::table('telescope_entries')
    ->where('type', 'request')
    ->where('content', 'like', '%auth%user%')
    ->orderBy('sequence', 'desc')
    ->limit(10)
    ->get();

echo "=== SQL ANALYSIS FOR AUTH/USER REQUESTS ===\n";
foreach ($entries as $entry) {
    $content = json_decode($entry->content, true);
    $time = $entry->created_at;
    $uri = $content['uri'] ?? 'N/A';
    $method = $content['method'] ?? 'N/A';
    $status = $content['response_status'] ?? 'N/A';
    $ip = $content['ip_address'] ?? 'N/A';
    $headers = $content['headers'] ?? [];
    $authHeader = $headers['authorization'] ?? 'NONE';
    echo "Time: $time | IP: $ip | $method $uri | Status: $status | AuthHeader: " . (is_array($authHeader) ? implode(', ', $authHeader) : $authHeader) . "\n";
}
