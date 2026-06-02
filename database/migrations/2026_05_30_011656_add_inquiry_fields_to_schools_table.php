<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->string('name_en')->nullable()->after('name');
            $table->string('contact_email')->nullable()->unique()->after('address');
            $table->string('contact_phone')->nullable()->after('contact_email');
            $table->string('city')->nullable()->after('contact_phone');
            $table->boolean('is_active')->default(false)->after('city');
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn(['name_en', 'contact_email', 'contact_phone', 'city', 'is_active']);
        });
    }
};
