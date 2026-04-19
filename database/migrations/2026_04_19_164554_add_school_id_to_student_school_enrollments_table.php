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
        Schema::table('student_school_enrollments', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->constrained()->cascadeOnDelete();
        });

        // Backfill the school_id using the classrooms table
        DB::statement('
            UPDATE student_school_enrollments
            SET school_id = classrooms.school_id
            FROM classrooms
            WHERE student_school_enrollments.classroom_id = classrooms.id
        ');

        // Make it non-nullable if you wish, but nullable is safer for existing bad data
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_school_enrollments', function (Blueprint $table) {
            $table->dropForeign(['school_id']);
            $table->dropColumn('school_id');
        });
    }
};
