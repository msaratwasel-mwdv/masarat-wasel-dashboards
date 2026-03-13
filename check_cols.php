<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Show students table columns
$cols = Schema::getColumnListing('students');
foreach ($cols as $i => $col) {
    echo "[$i] $col\n";
}
