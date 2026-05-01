<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds 'field_trip' to the bus_requests_request_type_check constraint in PostgreSQL.
     */
    public function up(): void
    {
        // Drop the old CHECK constraint and add a new one that includes field_trip
        DB::statement('ALTER TABLE bus_requests DROP CONSTRAINT IF EXISTS bus_requests_request_type_check');
        DB::statement("ALTER TABLE bus_requests ADD CONSTRAINT bus_requests_request_type_check CHECK (request_type IN ('permanent', 'temporary', 'field_trip'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE bus_requests DROP CONSTRAINT IF EXISTS bus_requests_request_type_check');
        DB::statement("ALTER TABLE bus_requests ADD CONSTRAINT bus_requests_request_type_check CHECK (request_type IN ('permanent', 'temporary'))");
    }
};
