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
            $table->foreignId('forth_route_id')->nullable()->constrained('routes');
            $table->foreignId('back_route_id')->nullable()->constrained('routes');
        });

        Schema::table('buses', function (Blueprint $table) {
            $table->foreignId('route_id')->nullable()->constrained('routes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['forth_route_id']);
            $table->dropForeign(['back_route_id']);
            $table->dropColumn(['forth_route_id', 'back_route_id']);
        });

        Schema::table('buses', function (Blueprint $table) {
            $table->dropForeign(['route_id']);
            $table->dropColumn(['route_id']);
        });
    }
};
