<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classrooms', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // اسم الفصل (مثال: أول ثانوي أ)
            $table->string('grade_level')->nullable(); // المرحلة الدراسية
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade'); // تابع لأي مدرسة
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classrooms');
    }
};
