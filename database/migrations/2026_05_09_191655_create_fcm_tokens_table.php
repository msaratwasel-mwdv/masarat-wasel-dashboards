<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fcm_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('device_id')->nullable()->index();
            $table->string('token')->unique();
            $table->string('device_type')->nullable(); // android, ios, web
            $table->string('app_bundle_id')->nullable();
            $table->string('preferred_language', 10)->default('ar');
            $table->string('device_name')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fcm_tokens');
    }
};
