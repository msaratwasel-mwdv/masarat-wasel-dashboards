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
        Schema::table('assistants', function (Blueprint $table) {

            if (!Schema::hasColumn('assistants', 'id_card_front_image')) {
                $table->string('id_card_front_image')->nullable()->after('emergency_contact_phone');
            }

            if (!Schema::hasColumn('assistants', 'id_card_back_image')) {
                $table->string('id_card_back_image')->nullable()->after('id_card_front_image');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assistants', function (Blueprint $table) {

            if (Schema::hasColumn('assistants', 'id_card_front_image')) {
                $table->dropColumn('id_card_front_image');
            }

            if (Schema::hasColumn('assistants', 'id_card_back_image')) {
                $table->dropColumn('id_card_back_image');
            }
        });
    }
};