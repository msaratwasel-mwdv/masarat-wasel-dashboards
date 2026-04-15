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
        Schema::create('field_trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            $table->foreignId('bus_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->text('description');
            $table->date('date');
            $table->time('departure_time');
            $table->time('arrival_time')->nullable();
            $table->string('destination_address')->nullable();
            $table->decimal('destination_latitude', 10, 7)->nullable();
            $table->decimal('destination_longitude', 10, 7)->nullable();
            $table->jsonb('external_members')->nullable();
            $table->decimal('cost', 10, 2)->unsigned()->nullable();
            $table->enum('status', ['pending', 'approved', 'started', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('field_trips');
    }
};
