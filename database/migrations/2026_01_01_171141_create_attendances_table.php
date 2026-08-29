<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                  ->constrained('students')
                  ->onDelete('cascade');

            $table->foreignId('classroom_id')
                  ->constrained('classrooms')
                  ->onDelete('cascade');

            $table->foreignId('recorded_by')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');

            $table->date('date');
            $table->enum('status', ['present', 'absent', 'late', 'excused']);
            $table->boolean('is_notified')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
