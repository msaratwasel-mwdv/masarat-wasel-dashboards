<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
try {
    (new Database\Seeders\ChatDemoSeeder())->run();
} catch (\Exception $e) {
    file_put_contents('seed_error.txt', $e->getMessage() . "\n" . $e->getTraceAsString());
}
