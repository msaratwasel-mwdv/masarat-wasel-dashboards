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
        Schema::create('field_trip_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('field_trip_id')->constrained()->onDelete('cascade');
            $table->string('national_id');
            $table->enum('type', ['student', 'user', 'external'])->default('student');
            $table->timestamps();

            // Unique constraints to prevent duplicate entries of the same person
            // PostgreSQL handles multiple NULLs in unique constraints correctly
            $table->unique(['field_trip_id', 'national_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('field_trip_participants');
    }
};
