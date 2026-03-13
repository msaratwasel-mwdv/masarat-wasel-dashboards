<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Student;
use Illuminate\Http\Request;

$user = User::where('national_id', '1000200030')->first();
if (!$user) {
    die("Guardian 1000200030 not found\n");
}

echo "Authenticated as: {$user->name} (ID: {$user->id})\n";

$students = Student::where('guardian_id', $user->id)
    ->where('is_active', true)
    ->get();

echo "Total Active Students for this Guardian in DB: " . $students->count() . "\n";

foreach ($students as $s) {
    echo "- Student ID: {$s->id} | Name: {$s->full_name}\n";
}
