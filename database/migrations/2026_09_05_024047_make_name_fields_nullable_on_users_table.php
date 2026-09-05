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
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name_ar', 191)->nullable()->change();
            $table->string('last_name_ar', 191)->nullable()->change();
            $table->string('first_name_en', 191)->nullable()->change();
            $table->string('last_name_en', 191)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name_ar', 191)->nullable(false)->change();
            $table->string('last_name_ar', 191)->nullable(false)->change();
            $table->string('first_name_en', 191)->nullable(false)->change();
            $table->string('last_name_en', 191)->nullable(false)->change();
        });
    }
};
