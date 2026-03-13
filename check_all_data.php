<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Student;

echo "--- Guardians List ---\n";
$guardians = User::where('role', 'guardian')->get();
foreach ($guardians as $g) {
    $count = Student::where('guardian_id', $g->id)->count();
    echo "ID: {$g->id} | Name: {$g->name} | Email: {$g->email} | Students: {$count}\n";
}

echo "\n--- All Students ---\n";
$students = Student::all();
foreach ($students as $s) {
    echo "ID: {$s->id} | Name: {$s->full_name} | Guardian ID: {$s->guardian_id} | Active: " . ($s->is_active ? 'Yes' : 'No') . "\n";
}
