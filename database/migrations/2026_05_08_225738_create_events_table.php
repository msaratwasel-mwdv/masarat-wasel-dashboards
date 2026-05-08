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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title_ar');
            $table->string('title_en');
            $table->text('content_ar')->nullable();
            $table->text('content_en')->nullable();
            $table->string('type')->default('news'); // news, workshop, bus_photos, activity
            $table->string('tag_ar')->nullable();
            $table->string('tag_en')->nullable();
            $table->string('image')->nullable();
            $table->date('event_date')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
