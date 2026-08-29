<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bus_id')->constrained();
            $table->foreignId('school_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('driver_id')->nullable();
            $table->foreignId('route_id')->nullable();
            
            $table->date('trip_date')->index();
            $table->string('type'); // forth, back
            
            // Security & Verification
            $table->boolean('video_check')->default(false);
            $table->string('video_path')->nullable();
            $table->timestamp('start_qr_scanned_at')->nullable();
            $table->timestamp('end_qr_scanned_at')->nullable();
            
            $table->dateTime('departure_time')->nullable();
            $table->dateTime('arrival_time')->nullable();
            
            // Status & Workflow
            $table->string('status')->default('pending');
            $table->enum('generation_type', ['auto', 'manual'])->default('auto');
            
            $table->text('cancellation_reason')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();

            // Unique constraint & indexes
            $table->unique(['bus_id', 'type', 'trip_date'], 'unique_bus_type_date');
            $table->index(['status', 'trip_date'], 'trips_status_date_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
