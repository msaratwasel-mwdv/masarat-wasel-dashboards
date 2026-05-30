<?php
// get_latest_telescope.php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$entries = DB::table('telescope_entries')
    ->orderBy('sequence', 'desc')
    ->limit(20)
    ->get();

echo "=== LATEST TELESCOPE ENTRIES ===\n";
foreach ($entries as $entry) {
    $content = json_decode($entry->content, true);
    $time = $entry->created_at;
    echo "Type: [" . strtoupper($entry->type) . "] | Time: $time\n";
    if ($entry->type === 'request') {
        $uri = $content['uri'] ?? 'N/A';
        $method = $content['method'] ?? 'N/A';
        $status = $content['response_status'] ?? 'N/A';
        echo "  -> $method $uri | Response Status: $status\n";
    } elseif ($entry->type === 'event') {
        $name = $content['name'] ?? 'N/A';
        $broadcast = ($content['broadcast'] ?? false) ? 'YES' : 'NO';
        echo "  -> Event: $name | Broadcasted: $broadcast\n";
    } elseif ($entry->type === 'exception') {
        $msg = $content['message'] ?? 'N/A';
        $file = $content['file'] ?? 'N/A';
        $line = $content['line'] ?? 'N/A';
        echo "  -> Exception: $msg\n  -> In $file:$line\n";
    } elseif ($entry->type === 'log') {
        $level = $content['level'] ?? 'N/A';
        $msg = $content['message'] ?? 'N/A';
        echo "  -> Log Level: [$level] | Message: $msg\n";
    }
    echo "---------------------------------------------------------\n";
}
