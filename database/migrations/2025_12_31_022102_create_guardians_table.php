<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guardians', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_en')->nullable();
            $table->string('national_id')->unique();
            $table->string('phone')->unique();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('home_number')->nullable();
            $table->enum('preferred_language', ['ar', 'en'])->default('ar');
            $table->string('image')->nullable();
            $table->foreignId('school_id')->constrained(); // تأكد من وجود هذا السطر
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guardians');
    }
};