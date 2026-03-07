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
            $table->integer('duration_days')->default(1)->after('trip_time');
            $table->text('rejection_reason')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('field_trips', function (Blueprint $table) {
            $table->dropColumn(['duration_days', 'rejection_reason']);
        });
    }
};
