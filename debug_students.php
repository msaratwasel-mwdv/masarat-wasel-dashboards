<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Student;

$guardianEmail = 'guardian1@wasel.com';
$user = User::where('email', $guardianEmail)->first();

if (!$user) {
    die("Guardian not found\n");
}

echo "Guardian: {$user->name} (ID: {$user->id})\n";

$students = Student::where('guardian_id', $user->id)->get();
echo "Total Students Found: " . $students->count() . "\n";

foreach ($students as $student) {
    echo "- ID: {$student->id}, Name: {$student->full_name}, Active: " . ($student->is_active ? 'Yes' : 'No') . "\n";
}
