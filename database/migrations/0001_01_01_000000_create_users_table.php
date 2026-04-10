<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {

            $table->id();

            $table->string('national_id')->unique();

            $table->string('first_name_ar');
            $table->string('second_name_ar');
            $table->string('third_name_ar');
            $table->string('last_name_ar');

            $table->string('first_name_en');
            $table->string('second_name_en');
            $table->string('third_name_en');
            $table->string('last_name_en');

            $table->string('email')->nullable()->unique();
            $table->string('phone')->nullable()->unique();

            // Profile / guardian data
            // $table->string('name_en')->nullable();
            // $table->text('address')->nullable();
            // $table->decimal('home_latitude', 10, 7)->nullable();
            // $table->decimal('home_longitude', 10, 7)->nullable();
            // $table->integer('proximity_alert_distance')->default(500);
            // $table->string('home_number')->nullable();
            // $table->enum('preferred_language', ['ar', 'en'])->default('ar');
            // $table->string('image')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};