<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\Student;

echo "--- Student Data Verification (Kholoud) ---\n";

$student = Student::with(['morningGroup.bus.driver', 'afternoonGroup.bus.driver'])->find(10); // Kholoud ID is 10

if ($student) {
    echo "Student: {$student->name} (ID: {$student->id})\n";
    
    echo "\n[MORNING]\n";
    $mGroup = $student->morningGroup;
    if ($mGroup) {
        $bus = $mGroup->bus;
        echo "Group ID: {$mGroup->id}\n";
        echo "Bus ID: " . ($bus->id ?? 'N/A') . " | Number: " . ($bus->number ?? 'N/A') . "\n";
        echo "Driver: " . ($bus->driver->name ?? 'N/A') . " (ID: " . ($bus->driver->id ?? 'N/A') . ")\n";
    } else {
        echo "No Morning Group assigned.\n";
    }

    echo "\n[AFTERNOON]\n";
    $aGroup = $student->afternoonGroup;
    if ($aGroup) {
        $bus = $aGroup->bus;
        echo "Group ID: {$aGroup->id}\n";
        echo "Bus ID: " . ($bus->id ?? 'N/A') . " | Number: " . ($bus->number ?? 'N/A') . "\n";
        echo "Driver: " . ($bus->driver->name ?? 'N/A') . " (ID: " . ($bus->driver->id ?? 'N/A') . ")\n";
    } else {
        echo "No Afternoon Group assigned.\n";
    }
} else {
    echo "Student 'Kholoud' (ID 10) not found.\n";
}
