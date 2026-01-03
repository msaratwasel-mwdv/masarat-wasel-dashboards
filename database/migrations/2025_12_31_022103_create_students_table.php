<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('student_code')->unique()->nullable(); // كود الطالب
            $table->string('full_name'); // اسم الطالب الكامل
            $table->string('national_id')->nullable(); // ⬅️ أضف هذا السطر
            $table->enum('gender', ['male', 'female'])->nullable(); // ⬅️ أضف هذا السطر
            $table->string('image')->nullable(); // ⬅️ أضف هذا السطر
            $table->boolean('is_active')->default(true); // حالة الطالب
            
            // ⬅️ أضف هذه العلاقات
            $table->foreignId('guardian_id')->constrained()->onDelete('cascade');
            $table->foreignId('supervisor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            
            $table->timestamps();
            
            // ⬅️ أضف indexes للبحث السريع
            $table->index(['student_code', 'national_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};