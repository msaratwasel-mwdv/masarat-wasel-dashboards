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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('national_id')->unique()->nullable();

            $table->string('email')->unique();

            $table->string('phone')->nullable()->unique(); // رقم الجوال
            $table->string('user_code')->nullable()->unique(); // الكود التعريفي (OD-001)
            $table->string('role')->default('parent'); // نوع المستخدم (admin, school_admin, driver...)

            // بيانات ولي الأمر (الأساسية)
            $table->string('name_en')->nullable();
            $table->text('address')->nullable();
            $table->string('home_number')->nullable();
            $table->enum('preferred_language', ['ar', 'en'])->default('ar');
            $table->string('image')->nullable();

            $table->foreignId('school_id')->nullable(); // ربط المستخدم بالمدرسة (فارغ لمدير الشركة)
            $table->boolean('is_active')->default(true); // حالة الحساب
            // ------------------------------------------

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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
