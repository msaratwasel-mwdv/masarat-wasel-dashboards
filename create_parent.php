<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$phone = '0551234567';
$nationalId = '1234567890';

$user = User::create([
    'name'        => 'أحمد محمد',
    'name_en'     => 'Ahmed Mohammed',
    'national_id' => $nationalId,
    'email'       => 'ahmed@test.com',
    'phone'       => $phone,
    'role'        => 'parent',
    'password'    => Hash::make($phone),  // رقم الجوال هو كلمة السر
    'is_active'   => 1,
]);

echo "=== تم إنشاء الحساب بنجاح ===\n";
echo "الاسم: {$user->name}\n";
echo "الرقم المدني (اسم المستخدم): {$user->national_id}\n";
echo "كلمة السر: {$phone}\n";
echo "الجوال: {$phone}\n";
echo "البريد: {$user->email}\n";
echo "ID: {$user->id}\n";
