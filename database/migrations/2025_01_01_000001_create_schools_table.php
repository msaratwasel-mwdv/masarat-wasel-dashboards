<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // اسم المدرسة
            $table->string('logo')->nullable();
            $table->string('location')->nullable(); // المدينة/الموقع
            $table->enum('status', ['Active', 'Inactive'])->default('Active'); // الحالة

            // خطط الاشتراك (Subscription Plan)
            $table->boolean('has_transport')->default(true); // خدمة النقل
            $table->boolean('has_attendance')->default(true); // خدمة الحضور

            $table->timestamps(); // تاريخ الإنشاء والتعديل
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schools');
    }
};
