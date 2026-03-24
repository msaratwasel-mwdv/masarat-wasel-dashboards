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
        Schema::table('supervisor_profiles', function (Blueprint $table) {
            $table->enum('supervisor_type', ['bus', 'class', 'both'])->default('bus')->after('status');
            $table->enum('tracking_type', ['phone', 'vehicle'])->default('phone')->after('supervisor_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supervisor_profiles', function (Blueprint $table) {
            $table->dropColumn(['supervisor_type', 'tracking_type']);
        });
    }
};
