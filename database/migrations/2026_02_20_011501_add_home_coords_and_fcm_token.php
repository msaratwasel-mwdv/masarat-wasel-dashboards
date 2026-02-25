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
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('home_latitude', 10, 7)->nullable()->after('address');
            $table->decimal('home_longitude', 10, 7)->nullable()->after('home_latitude');
            $table->integer('proximity_alert_distance')->default(500)->after('home_longitude'); // بالمتر
            $table->string('fcm_token')->nullable()->after('remember_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['home_latitude', 'home_longitude', 'proximity_alert_distance', 'fcm_token']);
        });
    }
};
