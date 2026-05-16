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
        if (!Schema::hasColumn('students', 'location_note')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('location_note', 1000)->nullable()->after('address');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('students', 'location_note')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropColumn('location_note');
            });
        }
    }
};
