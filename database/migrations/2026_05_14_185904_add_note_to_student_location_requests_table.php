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
        if (!Schema::hasColumn('student_location_requests', 'note')) {
            Schema::table('student_location_requests', function (Blueprint $table) {
                $table->string('note', 1000)->nullable()->after('new_address');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('student_location_requests', 'note')) {
            Schema::table('student_location_requests', function (Blueprint $table) {
                $table->dropColumn('note');
            });
        }
    }
};
