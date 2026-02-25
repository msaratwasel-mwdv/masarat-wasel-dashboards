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
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('morning_group_id')->nullable()->constrained('bus_groups')->nullOnDelete();
            $table->foreignId('afternoon_group_id')->nullable()->constrained('bus_groups')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['morning_group_id']);
            $table->dropForeign(['afternoon_group_id']);
            $table->dropColumn(['morning_group_id', 'afternoon_group_id']);
        });
    }
};
