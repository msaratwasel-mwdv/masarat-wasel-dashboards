<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the existing check constraint
        DB::statement('ALTER TABLE trip_attendances DROP CONSTRAINT IF EXISTS trip_attendances_status_check');
        
        // Add the new check constraint including 'excused'
        DB::statement("ALTER TABLE trip_attendances ADD CONSTRAINT trip_attendances_status_check CHECK (status::text = ANY (ARRAY['pending'::character varying, 'boarded'::character varying, 'dropped'::character varying, 'absent'::character varying, 'excused'::character varying]::text[]))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE trip_attendances DROP CONSTRAINT IF EXISTS trip_attendances_status_check');
        DB::statement("ALTER TABLE trip_attendances ADD CONSTRAINT trip_attendances_status_check CHECK (status::text = ANY (ARRAY['pending'::character varying, 'boarded'::character varying, 'dropped'::character varying, 'absent'::character varying]::text[]))");
    }
};
