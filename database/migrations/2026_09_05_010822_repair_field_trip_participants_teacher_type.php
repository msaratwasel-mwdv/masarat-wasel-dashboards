<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('field_trip_participants')
            ->where('type', 'student')
            ->whereIn('national_id', DB::table('users')->select('national_id'))
            ->whereNotIn('national_id', DB::table('students')->select('national_id'))
            ->update(['type' => 'user']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op: Data fix migration
    }
};
