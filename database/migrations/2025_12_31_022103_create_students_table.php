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

            // تحديد أطوال الحقول لتجنب المشكلة
            $table->string('student_code', 50)->unique()->nullable(); // ⬅️ تحديد طول 50
            $table->string('full_name'); // اسم الطالب الكامل
            $table->string('national_id', 20)->nullable(); // ⬅️ تحديد طول 20 بدلاً من 191
            $table->enum('gender', ['male', 'female'])->nullable();
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true); // حالة الطالب

            // العلاقات
            $table->foreignId('guardian_id')->constrained()->onDelete('cascade');
            $table->foreignId('supervisor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('school_id')->constrained()->onDelete('cascade');

            $table->timestamps();

            // ⬅️ تصحيح الصلاحيات: إزالة national_id من الصلاحية المركبة
            // طريقة 1: صلاحيات منفصلة (أفضل)
            $table->index('student_code');
            $table->index('national_id');
            $table->index('is_active');

            // أو طريقة 2: صلاحية مختصرة (إذا كنت تحتاج حقاً صلاحية مركبة)
            // $table->index(['student_code', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};