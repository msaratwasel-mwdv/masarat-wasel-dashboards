<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$entries = DB::table('telescope_entries')
    ->where('content', 'LIKE', '%LocationUpdated%')
    ->orderBy('sequence', 'desc')
    ->limit(10)
    ->get();

echo "=== LOCATION ENTRIES IN DATABASE ===\n";
foreach ($entries as $entry) {
    echo "ID: {$entry->uuid} | Type: {$entry->type} | Time: {$entry->created_at}\n";
    $content = json_decode($entry->content, true);
    if (isset($content['name'])) {
        echo "  Name/Class: {$content['name']}\n";
    }
    echo "---------------------------------------------------------\n";
}
