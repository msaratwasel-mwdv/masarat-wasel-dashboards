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
            $table->string('bus_code')->unique(); // BUS-001 (Code)
            $table->string('bus_number')->unique(); // رقم داخلي (من نسختك)
            $table->string('plate_number')->unique(); // أ ح د 1234

            // المواصفات
            $table->integer('capacity');
            $table->string('model'); // Mercedes 2023
            $table->year('year');
            $table->string('color')->nullable();
            $table->enum('type', ['permanent', 'temporary'])->default('permanent'); // من نسختك

            // العلاقات
            $table->foreignId('school_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('route_id')->nullable()->constrained('routes')->nullOnDelete();

            // الحالة والبيانات الإضافية
            $table->enum('status', ['active', 'maintenance', 'inactive', 'out_of_service'])->default('active');
            $table->string('qr_code_path')->nullable(); // مسار الصورة

            // حقول التتبع
            $table->decimal('current_latitude', 10, 7)->nullable();
            $table->decimal('current_longitude', 10, 7)->nullable();
            $table->timestamp('last_location_update')->nullable();
            $table->enum('trip_status', ['idle', 'to_school', 'to_home', 'at_school', 'stopped'])->nullable();
            $table->timestamp('trip_start_time')->nullable(); // وقت بدء الرحلة الحالية
            $table->timestamp('trip_end_time')->nullable();   // وقت انتهاء الرحلة الحالية

            $table->timestamps();
            $table->softDeletes(); // للحفاظ على السجلات المحذوفة

            // إضافة index للموقع
            $table->index(['current_latitude', 'current_longitude'], 'buses_location_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buses');
    }
};