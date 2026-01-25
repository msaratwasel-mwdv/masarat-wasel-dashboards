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
        Schema::table('buses', function (Blueprint $table) {
            // حقول التتبع
            $table->decimal('current_latitude', 10, 7)->nullable()->after('qr_code_path');
            $table->decimal('current_longitude', 10, 7)->nullable()->after('current_latitude');
            $table->timestamp('last_location_update')->nullable()->after('current_longitude');
            
            // حالة الرحلة
            $table->enum('trip_status', ['at_school', 'on_route', 'stopped', 'idle'])
                  ->nullable()
                  ->after('last_location_update');
            
            // لون الباص
            $table->string('color')->nullable()->after('year');
            
            // إضافة index للموقع
            $table->index(['current_latitude', 'current_longitude'], 'buses_location_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buses', function (Blueprint $table) {
            $table->dropIndex('buses_location_index');
            $table->dropColumn([
                'current_latitude',
                'current_longitude',
                'last_location_update',
                'trip_status',
                'color',
            ]);
        });
    }
};
