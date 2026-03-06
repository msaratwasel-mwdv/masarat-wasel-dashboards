<?php
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "Checking for trip_attendances table...\n";
if (Schema::hasTable('trip_attendances')) {
    echo "Table exists. Dropping it...\n";
    Schema::dropIfExists('trip_attendances');
}

echo "Retrying migration...\n";
try {
    Artisan::call('migrate', ['--force' => true]);
    echo Artisan::output();
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
