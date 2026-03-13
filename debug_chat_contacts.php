<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Guardian ID: 17\n";
$students = \App\Models\Student::where('guardian_id', 17)->get();

foreach ($students as $s) {
    echo "Student: " . $s->full_name . " (ID: " . $s->id . ")\n";
    
    // Check morning bus
    $morningBus = $s->morningGroup?->bus;
    if ($morningBus) {
        $driver = $morningBus->driver;
        $assistant = $morningBus->assistant;
        echo " - Morning Bus ID: " . $morningBus->id . "\n";
        echo "   - Driver: " . ($driver ? $driver->name . " (ID: " . $driver->id . ")" : "None") . "\n";
        echo "   - Assistant: " . ($assistant ? $assistant->name . " (ID: " . $assistant->id . ")" : "None") . "\n";
    } else {
        echo " - Morning Bus: None\n";
    }

    // Check afternoon bus
    $afternoonBus = $s->afternoonGroup?->bus;
    if ($afternoonBus) {
        $driver = $afternoonBus->driver;
        $assistant = $afternoonBus->assistant;
        echo " - Afternoon Bus ID: " . $afternoonBus->id . "\n";
        echo "   - Driver: " . ($driver ? $driver->name . " (ID: " . $driver->id . ")" : "None") . "\n";
        echo "   - Assistant: " . ($assistant ? $assistant->name . " (ID: " . $assistant->id . ")" : "None") . "\n";
    } else {
        echo " - Afternoon Bus: None\n";
    }
}
