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
        Schema::create('bus_boarding_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('bus_id')->constrained()->onDelete('cascade');

            // نوع الحدث: ركوب أو نزول
            $table->enum('type', ['boarding', 'alighting']);

            // اتجاه الرحلة: صباحي (للمدرسة) أو عودة (للبيت)
            $table->enum('direction', ['to_school', 'to_home']);

            // موقع الحدث
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            // من سجّل الحدث (المشرف/السائق)
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('recorded_at');
            $table->timestamps();

            // Indexes
            $table->index(['student_id', 'recorded_at']);
            $table->index(['bus_id', 'recorded_at']);
            $table->index(['type', 'direction']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bus_boarding_logs');
    }
};
