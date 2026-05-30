<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$entries = DB::table('telescope_entries')
    ->where('type', 'exception')
    ->orderBy('sequence', 'desc')
    ->limit(10)
    ->get();

echo "=== LATEST EXCEPTIONS IN TELESCOPE ===\n";
if ($entries->isEmpty()) {
    echo "No exceptions found.\n";
} else {
    foreach ($entries as $entry) {
        $content = json_decode($entry->content, true);
        echo "Time: {$entry->created_at}\n";
        echo "  Message: " . ($content['message'] ?? 'N/A') . "\n";
        echo "  File: " . ($content['file'] ?? 'N/A') . ":" . ($content['line'] ?? 'N/A') . "\n";
        echo "---------------------------------------------------------\n";
    }
}
