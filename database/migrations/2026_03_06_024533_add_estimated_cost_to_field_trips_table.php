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
        Schema::table('field_trips', function (Blueprint $table) {
            if (!Schema::hasColumn('field_trips', 'cost')) {
                $table->decimal('cost', 10, 2)->nullable();
            }
            if (!Schema::hasColumn('field_trips', 'bus_id')) {
                $table->foreignId('bus_id')->nullable()->constrained('buses')->nullOnDelete();
            }
            if (!Schema::hasColumn('field_trips', 'teacher_names')) {
                $table->json('teacher_names')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('field_trips', function (Blueprint $table) {
            $table->dropColumn(['cost', 'bus_id', 'teacher_names']);
        });
    }
};
