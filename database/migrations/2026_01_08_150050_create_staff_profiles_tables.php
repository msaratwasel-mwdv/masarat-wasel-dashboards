<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. تحديث جدول المستخدمين لإضافة الهوية الوطنية (للدخول)


        // 2. جدول بيانات السائقين التفصيلية
        Schema::create('driver_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            $table->string('license_number')->unique();
            $table->date('license_expiry_date');

            // الحالة الخاصة بالسائقين (حسب الطلب)
            $table->enum('status', ['Pending Training', 'Active', 'Suspended', 'On Leave'])
                ->default('Pending Training');

            $table->timestamps();
        });

        // 3. جدول بيانات المشرفين التفصيلية
        Schema::create('supervisor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();

            // الحالة الخاصة بالمشرفين (حسب الطلب)
            $table->enum('status', ['Trainee', 'Active', 'On Leave', 'Inactive'])
                ->default('Trainee');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supervisor_profiles');
        Schema::dropIfExists('driver_profiles');
    }
};
