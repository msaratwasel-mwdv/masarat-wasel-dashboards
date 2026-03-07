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
            $table->string('trip_name');
            $table->text('description');
            $table->date('trip_date');
            $table->time('trip_time');
            $table->integer('duration_days')->default(1);
            $table->string('destination');
            $table->decimal('destination_lat', 10, 8)->nullable();
            $table->decimal('destination_lng', 11, 8)->nullable();
            $table->foreignId('bus_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('number_of_students');
            $table->enum('status', ['planned', 'approved', 'started', 'in_progress', 'completed', 'cancelled'])->default('planned');
            $table->text('rejection_reason')->nullable();
            $table->decimal('estimated_cost', 10, 2)->nullable();
            $table->json('teacher_names')->nullable();
            $table->boolean('approved_by_school')->default(false);
            $table->boolean('approved_by_company')->default(false);
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
