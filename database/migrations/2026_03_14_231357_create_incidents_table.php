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
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('bus_id')->constrained('buses')->cascadeOnDelete();
            $table->foreignId('trip_id')->nullable()->constrained('field_trips')->nullOnDelete();
            
            $table->enum('type', ['sos', 'accident', 'breakdown', 'health']);
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            
            $table->text('description');
            
            $table->decimal('location_lat', 10, 8)->nullable();
            $table->decimal('location_lng', 11, 8)->nullable();
            
            $table->enum('status', ['active', 'in_progress', 'resolved'])->default('active');
            
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->json('photos')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
