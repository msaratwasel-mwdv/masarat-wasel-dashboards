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
        // 1. Change column default value to true
        Schema::table('schools', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->change();
        });

        // 2. Reactivate existing active/legacy schools (schools without pending approval subscriptions)
        $pendingSchoolIds = DB::table('subscriptions')
            ->where('status', 'pending_approval')
            ->pluck('school_id');

        DB::table('schools')
            ->whereNotIn('id', $pendingSchoolIds)
            ->update(['is_active' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->boolean('is_active')->default(false)->change();
        });
    }
};
