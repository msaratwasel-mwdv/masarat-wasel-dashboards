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
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('users');
            $table->foreignId('bus_id')->constrained();
            $table->foreignId('route_id')->nullable()->constrained();
            $table->foreignId('driver_id')->nullable()->constrained('users');
            $table->foreignId('assistant_id')->nullable()->constrained('users');
            $table->date('trip_date')->index();
            $table->string('type'); // forth, back, field_trip
            $table->boolean('video_check')->default(false);
            $table->dateTime('departure_time')->nullable();
            $table->dateTime('arrival_time')->nullable();
            $table->string('status')->default('pending'); // pending, in_progress, completed, on_route
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
