<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// الصفوف الدراسية الحقيقية
$grades = [
    'الصف الأول الابتدائي',
    'الصف الثاني الابتدائي',
    'الصف الثالث الابتدائي',
    'الصف الرابع الابتدائي',
    'الصف الخامس الابتدائي',
    'الصف السادس الابتدائي',
    'الصف الأول المتوسط',
    'الصف الثاني المتوسط',
    'الصف الثالث المتوسط',
];

$students = App\Models\Student::orderBy('id')->get();
echo "Updating " . $students->count() . " students with grades..." . PHP_EOL;

foreach ($students as $index => $student) {
    $grade = $grades[$index % count($grades)];
    $student->grade = $grade;
    $student->save();
    echo "  Student [{$student->id}] {$student->full_name} → {$grade}" . PHP_EOL;
}
echo "✅ Done!" . PHP_EOL;
