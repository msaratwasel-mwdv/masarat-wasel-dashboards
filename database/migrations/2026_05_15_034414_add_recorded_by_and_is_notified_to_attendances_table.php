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
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'recorded_by')) {
                $table->foreignId('recorded_by')->nullable()->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('attendances', 'is_notified')) {
                $table->boolean('is_notified')->default(false);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'recorded_by')) {
                $table->dropForeign(['recorded_by']);
                $table->dropColumn('recorded_by');
            }
            if (Schema::hasColumn('attendances', 'is_notified')) {
                $table->dropColumn('is_notified');
            }
        });
    }
};
