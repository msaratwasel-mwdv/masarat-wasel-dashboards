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
        Schema::create('assignment_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bus_id')->constrained()->cascadeOnDelete();

            // نسجل الحالة "من" -> "إلى" (لنعرف ماذا تغير بالضبط)
            $table->string('event_type'); // 'driver_change', 'supervisor_change', 'school_change'

            $table->foreignId('old_driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('new_driver_id')->nullable()->constrained('users')->nullOnDelete();

            $table->foreignId('old_supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('new_supervisor_id')->nullable()->constrained('users')->nullOnDelete();

            $table->foreignId('old_school_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('new_school_id')->nullable()->constrained('users')->nullOnDelete();

            // من قام بالتغيير؟ (للمساءلة الإدارية)
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps(); // created_at هو وقت التغيير
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assignment_histories');
    }
};
