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
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->nullable()->constrained()->cascadeOnDelete();
            // nullable = عطلة عامة لكل المدارس (يحددها الأدمن)
            $table->string('name');             // "عيد الفطر"
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('type', ['official', 'school_specific', 'emergency']);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();

            // منع تكرار نفس العطلة في نفس التاريخ لنفس المدرسة (أو العطل العامة)
            $table->unique(['school_id', 'start_date', 'end_date'], 'unique_holiday_per_school_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('holidays');
    }
};
