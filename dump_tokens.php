<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$t = \Illuminate\Support\Facades\Cache::get('simulator_tokens');
echo "Parent:\nBearer " . $t['parent'] . "\n\n";
echo "Driver:\nBearer " . $t['driver'] . "\n\n";
echo "Supervisor:\nBearer " . $t['supervisor'] . "\n";
