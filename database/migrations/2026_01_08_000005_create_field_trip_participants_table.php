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
            $table->enum('participant_type', ['bus', 'driver', 'supervisor', 'teacher']);
            $table->unsignedBigInteger('participant_id');
            $table->timestamps();

            // Index for better query performance
            $table->index(['field_trip_id', 'participant_type']);
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
