<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price_per_student', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->integer('max_buses')->nullable();
            $table->boolean('has_driver_app')->default(false);
            $table->boolean('has_parent_app')->default(false);
            $table->boolean('has_supervisor_app')->default(false);
            $table->string('notifications_limit')->nullable();
            $table->boolean('has_reports')->default(false);
            $table->boolean('has_api_access')->default(false);
            $table->boolean('has_dedicated_support')->default(false);
            $table->integer('sort_order')->default(0);
            $table->string('badge')->nullable();
            $table->string('currency', 10)->default('OMR');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
