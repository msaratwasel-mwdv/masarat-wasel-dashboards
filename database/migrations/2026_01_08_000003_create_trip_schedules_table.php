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
        Schema::create('trip_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bus_id')->constrained()->onDelete('cascade');
            $table->foreignId('school_id')->constrained('users')->onDelete('cascade');
            $table->tinyInteger('day_of_week')->comment('0=Sunday, 6=Saturday');
            $table->time('gathering_time')->comment('Morning student gathering time');
            $table->time('departure_time')->comment('Bus departure from school');
            $table->time('return_time')->comment('Bus return to school');
            $table->time('last_dropoff_time')->comment('Last student dropoff time');
            $table->boolean('is_exception')->default(false);
            $table->date('exception_date')->nullable();
            $table->string('exception_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trip_schedules');
    }
};
