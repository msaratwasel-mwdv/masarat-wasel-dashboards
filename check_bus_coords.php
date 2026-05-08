<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$bus = \App\Models\Bus::where('bus_number', 'B-300')->first();
if ($bus) {
    echo "Bus B-300:\n";
    echo "  Lat: " . ($bus->latitude ?? 'NULL') . "\n";
    echo "  Lng: " . ($bus->longitude ?? 'NULL') . "\n";
    echo "  Status: {$bus->trip_status}\n";
    echo "  Last Update: " . ($bus->last_location_update ?? 'NULL') . "\n";
} else {
    echo "Bus B-300 not found\n";
}
