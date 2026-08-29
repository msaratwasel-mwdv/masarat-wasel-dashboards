<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('buses', function (Blueprint $table) {
            $table->id();

            // الهوية التعريفية
            $table->string('bus_number')->unique();
            $table->string('plate_number')->unique();

            // المواصفات
            $table->integer('capacity');
            $table->string('model');
            $table->year('year');
            $table->string('color')->nullable();
            
            // العلاقات
            $table->foreignId('school_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assistant_id')->nullable();
            $table->foreignId('field_supervisor_id')->nullable();
            $table->foreignId('route_id')->nullable()->constrained('routes')->nullOnDelete();

            // الحالة والبيانات الإضافية
            $table->enum('status', ['active', 'maintenance', 'inactive', 'out_of_service'])->default('active');
            $table->string('front_qr')->nullable();
            $table->string('back_qr')->nullable();
            
            // حقول التتبع
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('target_latitude', 10, 7)->nullable();
            $table->decimal('target_longitude', 10, 7)->nullable();
            $table->timestamp('last_location_update')->nullable();

            $table->index(['school_id', 'status'], 'idx_buses_school_status');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buses');
    }
};