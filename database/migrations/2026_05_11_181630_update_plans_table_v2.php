<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            // Translations
            $table->string('name_ar')->nullable()->after('name');
            $table->string('name_en')->nullable()->after('name_ar');
            $table->text('description_ar')->nullable()->after('description');
            $table->text('description_en')->nullable()->after('description_ar');
            $table->string('badge_ar')->nullable()->after('badge');
            $table->string('badge_en')->nullable()->after('badge_ar');

            // Pricing
            $table->decimal('price_per_student_yearly', 10, 2)->default(0)->after('price_per_student');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn([
                'name_ar', 'name_en', 
                'description_ar', 'description_en', 
                'badge_ar', 'badge_en',
                'price_per_student_yearly'
            ]);
        });
    }
};
