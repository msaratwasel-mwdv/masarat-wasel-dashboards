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
        Schema::table('bus_students', function (Blueprint $table) {
            $table->dropForeign(['bus_id']);
            $table->dropForeign(['student_id']);
            $table->dropUnique(['bus_id', 'student_id']);
        });

        Schema::table('bus_students', function (Blueprint $table) {
            $table->enum('trip_type', ['morning', 'afternoon', 'both'])->default('both')->after('is_active');
            $table->unique(['bus_id', 'student_id', 'trip_type'], 'bus_student_trip_unique');

            $table->foreign('bus_id')->references('id')->on('buses')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bus_students', function (Blueprint $table) {
            $table->dropForeign(['bus_id']);
            $table->dropForeign(['student_id']);
            $table->dropUnique('bus_student_trip_unique');
            $table->dropColumn('trip_type');
        });

        Schema::table('bus_students', function (Blueprint $table) {
            $table->unique(['bus_id', 'student_id']);

            $table->foreign('bus_id')->references('id')->on('buses')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
        });
    }
};
