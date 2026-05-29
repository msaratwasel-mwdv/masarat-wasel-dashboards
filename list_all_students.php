<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Student;

$students = Student::all();
echo "Total students: " . $students->count() . "\n";
foreach ($students as $s) {
    echo "ID: {$s->id} | Name: {$s->first_name_ar} {$s->last_name_ar} | Code: {$s->student_code}\n";
}
