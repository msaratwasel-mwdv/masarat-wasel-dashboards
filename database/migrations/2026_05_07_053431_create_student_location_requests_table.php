<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_location_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('guardian_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('school_id')->constrained()->onDelete('cascade');

            $table->decimal('old_latitude', 10, 8)->nullable();
            $table->decimal('old_longitude', 11, 8)->nullable();
            $table->string('old_address', 500)->nullable();

            $table->decimal('new_latitude', 10, 8);
            $table->decimal('new_longitude', 11, 8);
            $table->string('new_address', 500)->nullable();
            $table->string('note', 1000)->nullable();

            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->string('rejection_reason')->nullable();

            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_location_requests');
    }
};
