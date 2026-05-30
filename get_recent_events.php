<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$entries = DB::table('telescope_entries')
    ->where('type', 'event')
    ->orderBy('sequence', 'desc')
    ->limit(15)
    ->get();

echo "=== RECENT EVENTS ===\n";
foreach ($entries as $entry) {
    $content = json_decode($entry->content, true);
    $name = $content['name'] ?? 'N/A';
    $broadcast = ($content['broadcast'] ?? false) ? 'YES' : 'NO';
    echo "Time: {$entry->created_at} | Event: $name | Broadcasted: $broadcast\n";
}
