<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Student;

// ولي الأمر: أحمد محمد (ID=18)
$parent = User::find(18);
if (!$parent) {
    echo "❌ Parent not found!\n";
    exit;
}

// أول مدرسة وباص موجودين
$school = \App\Models\School::first();
$bus = \App\Models\Bus::first();

if (!$school || !$bus) {
    echo "❌ No school or bus found!\n";
    exit;
}

// إضافة طالب
$student = Student::create([
    'name'         => 'سارة أحمد',
    'name_en'      => 'Sarah Ahmed',
    'national_id'  => '300400500601',
    'gender'       => 'female',
    'student_code' => 'STU-NEW-1',
    'grade'        => 'الصف الثالث الابتدائي',
    'school_id'    => $school->id,
    'bus_id'       => $bus->id,
    'guardian_id'  => $parent->id,
    'is_active'    => 1,
]);

echo "=== تم بنجاح ===\n";
echo "ولي الأمر: {$parent->name} (ID: {$parent->id})\n";
echo "الطالب: {$student->name} (ID: {$student->id})\n";
echo "المدرسة: {$school->name}\n";
echo "الباص: Bus #{$bus->bus_number}\n";
echo "الصف: {$student->grade}\n";
