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
        Schema::table('trip_attendances', function (Blueprint $table) {
            $table->timestamp('waiting_start_time')->nullable()->after('status');
            $table->integer('extra_wait_time')->default(0)->after('waiting_start_time'); // stored in seconds
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trip_attendances', function (Blueprint $table) {
            $table->dropColumn(['waiting_start_time', 'extra_wait_time']);
        });
    }
};
