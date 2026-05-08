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
        Schema::table('drivers', function (Blueprint $table) {
            $table->string('id_card_front_image')->nullable()->after('license_back_image');
            $table->string('id_card_back_image')->nullable()->after('id_card_front_image');
        });

        Schema::table('assistants', function (Blueprint $table) {
            $table->string('id_card_front_image')->nullable()->after('emergency_contact_phone');
            $table->string('id_card_back_image')->nullable()->after('id_card_front_image');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn(['id_card_front_image', 'id_card_back_image']);
        });

        Schema::table('assistants', function (Blueprint $table) {
            $table->dropColumn(['id_card_front_image', 'id_card_back_image']);
        });
    }
};
