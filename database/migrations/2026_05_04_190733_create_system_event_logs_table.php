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
        Schema::create('system_event_logs', function (Blueprint $table) {
            $table->id();
            $table->string('event_type'); // e.g., 'address_change', 'trip_state_transition'
            $table->string('entity_type'); // e.g., 'Student', 'Trip'
            $table->unsignedBigInteger('entity_id');
            $table->unsignedBigInteger('user_id')->nullable(); // who triggered the action
            $table->string('role')->nullable(); // e.g., 'parent', 'driver', 'assistant'
            $table->json('before_data')->nullable();
            $table->json('after_data')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_event_logs');
    }
};
