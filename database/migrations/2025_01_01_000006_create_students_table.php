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

            $table->string('student_code', 50)->unique()->nullable();

            $table->string('first_name_ar');
            $table->string('last_name_ar');
            $table->string('first_name_en');
            $table->string('last_name_en');

            $table->string('national_id', 20)->nullable();
            $table->enum('gender', ['male', 'female'])->nullable();
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true);

            $table->string('address')->nullable();
            $table->string('location_note', 1000)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();

            $table->foreignId('forth_bus_id')->nullable()->constrained('buses')->nullOnDelete();
            $table->decimal('forth_latitude', 10, 8)->nullable();
            $table->decimal('forth_longitude', 11, 8)->nullable();

            $table->foreignId('back_bus_id')->nullable()->constrained('buses')->nullOnDelete();
            $table->decimal('back_latitude', 10, 8)->nullable();
            $table->decimal('back_longitude', 11, 8)->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('student_code');
            $table->index('national_id');
            $table->index('is_active');
            $table->index(['forth_bus_id', 'is_active'], 'idx_students_forth_bus_active');
            $table->index(['back_bus_id', 'is_active'], 'idx_students_back_bus_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};