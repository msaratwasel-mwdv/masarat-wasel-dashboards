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
        Schema::create('inspection_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('inspections')->cascadeOnDelete();
            $table->foreignId('inspection_item_id')->constrained('inspection_items')->cascadeOnDelete();

            $table->boolean('is_passed')->default(true);
            $table->text('notes')->nullable();

            $table->timestamps();

            // Prevent duplicate records for the same item in one inspection
            $table->unique(['inspection_id', 'inspection_item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspection_results');
    }
};
