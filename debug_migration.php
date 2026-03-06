<?php
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

try {
    Artisan::call('migrate', [
        '--path' => 'database/migrations/2026_03_06_001434_create_trip_attendances_table.php',
        '--force' => true
    ]);
    echo Artisan::output();
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    if (method_exists($e, 'getQuery')) {
        echo "QUERY: " . $e->getQuery() . "\n";
    }
}
