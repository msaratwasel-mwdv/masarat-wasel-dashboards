<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Bus;
use App\Models\Trip;
use App\Models\Student;

$busNumber = 'B-300';
$bus = Bus::where('bus_number', $busNumber)->first();

if (!$bus) {
    die("Bus $busNumber not found\n");
}

echo "=== Bus Info ===\n";
echo "ID: {$bus->id}\n";
echo "Number: {$bus->bus_number}\n";
echo "Plate: {$bus->plate_number}\n";
echo "Status: {$bus->trip_status}\n";
echo "Lat: {$bus->latitude}\n";
echo "Lng: {$bus->longitude}\n";
echo "Last Update: {$bus->last_location_update}\n";

echo "\n=== Active Trips Today ===\n";
$today = date('Y-m-d');
$trips = Trip::where('bus_id', $bus->id)
    ->whereDate('trip_date', $today)
    ->get();

if ($trips->isEmpty()) {
    echo "No trips found for today ($today)\n";
} else {
    foreach ($trips as $trip) {
        echo "Trip ID: {$trip->id} | Type: {$trip->type} | Status: {$trip->status}\n";
    }
}

echo "\n=== Students on this Bus ===\n";
$students = Student::where('forth_bus_id', $bus->id)
    ->orWhere('back_bus_id', $bus->id)
    ->get();

foreach ($students as $student) {
    echo "Student: {$student->full_name} | Code: {$student->student_code}\n";
}
