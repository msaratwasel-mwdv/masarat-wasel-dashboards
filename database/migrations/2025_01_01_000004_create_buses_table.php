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
            $table->string('bus_number')->unique(); // رقم داخلي
            $table->string('plate_number')->unique(); // أ ح د 1234

            // المواصفات
            $table->integer('capacity');
            $table->string('model'); // Mercedes 2023
            $table->year('year');
            $table->string('color')->nullable();
            
            // العلاقات
            $table->foreignId('school_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assistant_id')->nullable()->constrained('assistants')->nullOnDelete();
            $table->foreignId('field_supervisor_id')->nullable()->constrained('field_supervisors')->nullOnDelete();
            $table->foreignId('route_id')->nullable()->constrained('routes')->nullOnDelete();

            // الحالة والبيانات الإضافية
            $table->enum('status', ['active', 'maintenance', 'inactive', 'out_of_service'])->default('active');
            $table->string('front_qr')->nullable();
            $table->string('back_qr')->nullable();
            
            // حقول التتبع
            $table->geometry('location', 'point')->nullable();
            $table->timestamp('last_location_update')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buses');
    }
};