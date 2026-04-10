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

            $table->string('first_name_ar');
            $table->string('second_name_ar');
            $table->string('third_name_ar');
            $table->string('last_name_ar');

            $table->string('first_name_en');
            $table->string('second_name_en');
            $table->string('third_name_en');
            $table->string('last_name_en');

            $table->string('national_id', 20)->nullable();
            $table->enum('gender', ['male', 'female'])->nullable();
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true);

            $table->foreignId('forth_bus_id')->nullable()->constrained('buses')->nullOnDelete();
            $table->foreignId('back_bus_id')->nullable()->constrained('buses')->nullOnDelete();

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
