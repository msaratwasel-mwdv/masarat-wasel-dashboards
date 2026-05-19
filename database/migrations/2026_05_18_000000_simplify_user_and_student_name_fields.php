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
        // 1. Data Migration: Merge second and third names into first_name to preserve data
        // For users table
        DB::statement("UPDATE users SET first_name_ar = TRIM(CONCAT(first_name_ar, ' ', COALESCE(second_name_ar, ''), ' ', COALESCE(third_name_ar, ''))) WHERE second_name_ar IS NOT NULL OR third_name_ar IS NOT NULL");
        DB::statement("UPDATE users SET first_name_en = TRIM(CONCAT(first_name_en, ' ', COALESCE(second_name_en, ''), ' ', COALESCE(third_name_en, ''))) WHERE second_name_en IS NOT NULL OR third_name_en IS NOT NULL");

        // For students table
        DB::statement("UPDATE students SET first_name_ar = TRIM(CONCAT(first_name_ar, ' ', COALESCE(second_name_ar, ''), ' ', COALESCE(third_name_ar, ''))) WHERE second_name_ar IS NOT NULL OR third_name_ar IS NOT NULL");
        DB::statement("UPDATE students SET first_name_en = TRIM(CONCAT(first_name_en, ' ', COALESCE(second_name_en, ''), ' ', COALESCE(third_name_en, ''))) WHERE second_name_en IS NOT NULL OR third_name_en IS NOT NULL");

        // 2. Drop the redundant columns
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'second_name_ar',
                'third_name_ar',
                'second_name_en',
                'third_name_en',
            ]);
        });

        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'second_name_ar',
                'third_name_ar',
                'second_name_en',
                'third_name_en',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('second_name_ar')->nullable();
            $table->string('third_name_ar')->nullable();
            $table->string('second_name_en')->nullable();
            $table->string('third_name_en')->nullable();
        });

        Schema::table('students', function (Blueprint $table) {
            $table->string('second_name_ar')->nullable();
            $table->string('third_name_ar')->nullable();
            $table->string('second_name_en')->nullable();
            $table->string('third_name_en')->nullable();
        });
    }
};
