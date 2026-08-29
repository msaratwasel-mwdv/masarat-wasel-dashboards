<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trip_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained();
            $table->enum('status', ['pending', 'boarded', 'dropped', 'absent', 'excused', 'waiting'])->default('pending');
            $table->timestamp('waiting_start_time')->nullable();
            $table->integer('extra_wait_time')->default(0); // stored in seconds
            $table->timestamp('check_in_time')->nullable();
            $table->timestamp('check_out_time')->nullable();
            $table->timestamps();

            // Performance & Integrity
            $table->unique(['trip_id', 'student_id'], 'unique_trip_student');
            $table->index(['trip_id', 'status'], 'idx_trip_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_attendances');
    }
};
