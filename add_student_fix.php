<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Student;
use App\Models\School;
use App\Models\Bus;

// ولي الأمر: أحمد محمد (ID=18)
$parent = User::find(18);
if (!$parent) {
    echo "❌ Parent not found!\n";
    exit;
}

$school = School::first();
$bus = Bus::first();

if (!$school || !$bus) {
    echo "❌ No school or bus found!\n";
    exit;
}

// إضافة طالب بالتركيبة الصحيحة للجدول الحالي
$student = Student::create([
    'full_name'        => 'سارة أحمد',
    'full_name_en'     => 'Sarah Ahmed',
    'student_code'     => 'STU-NEW-' . rand(1000, 9999),
    'national_id'      => '300400500601',
    'gender'           => 'female',
    // 'grade' مش موجودة في fillable تبع Student، غالباً موجودة في جدول منفصل أو مش مطلوبة
    'guardian_id'      => $parent->id,
    'school_id'        => $school->id,
    'is_active'        => 1,
]);

// إضافة ارتباط بالطالب والمدرسة والباص
\App\Models\StudentSchoolEnrollment::create([
    'student_id' => $student->id,
    'school_id'  => $school->id,
    'bus_id'     => $bus->id,
    'grade'      => 'الصف الثالث الابتدائي',
    'is_active'  => 1,
]);

echo "=== تم الانتهاء بنجاح ===\n";
echo "الطالبة: {$student->full_name}\n";
echo "الرقم الأكاديمي: {$student->student_code}\n";
echo "مرتبطة بولي الأمر: {$parent->name}\n";
