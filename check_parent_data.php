<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Student;

// Get a guardian user
$guardian = User::whereHas('roles', fn($q) => $q->where('name', 'parent'))->first();

if (!$guardian) {
    die("No guardian found\n");
}

echo "=== Guardian Info ===\n";
echo "ID: {$guardian->id}\n";
echo "Name: {$guardian->name}\n";

echo "\n=== Children Info ===\n";
// The relationship in User.php is 'students'
$students = $guardian->students;

if ($students->isEmpty()) {
    echo "No students found for this guardian.\n";
}

foreach ($students as $student) {
    echo "Student: {$student->full_name} (ID: {$student->id})\n";
    echo "  Forth Bus ID: " . ($student->forth_bus_id ?? 'NULL') . "\n";
    echo "  Back Bus ID: " . ($student->back_bus_id ?? 'NULL') . "\n";
    
    if ($student->forth_bus_id) {
        $bus = \App\Models\Bus::find($student->forth_bus_id);
        if ($bus) {
            echo "  Forth Bus Number: {$bus->bus_number} (Status: {$bus->trip_status})\n";
        }
    }
    if ($student->back_bus_id) {
        $bus = \App\Models\Bus::find($student->back_bus_id);
        if ($bus) {
            echo "  Back Bus Number: {$bus->bus_number} (Status: {$bus->trip_status})\n";
        }
    }
}
