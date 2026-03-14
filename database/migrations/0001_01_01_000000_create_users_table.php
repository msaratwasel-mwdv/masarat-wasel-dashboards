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
            $table->string('role')->default('parent'); // admin, school_admin, school, driver, supervisor, student, guardian
            $table->string('name');
            $table->string('name_en')->nullable();
            $table->string('national_id')->unique()->nullable();
            $table->string('email')->unique()->nullable(); // Students/Schools might not have emails or it might be optional
            $table->string('phone')->nullable()->unique();
            $table->string('user_code')->nullable()->unique();
            $table->string('image')->nullable();
            $table->text('address')->nullable();
            $table->boolean('is_active')->default(true);

            // Guardian/Parent specific
            $table->decimal('home_latitude', 10, 7)->nullable();
            $table->decimal('home_longitude', 10, 7)->nullable();
            $table->integer('proximity_alert_distance')->default(500);
            $table->string('home_number')->nullable();
            $table->enum('preferred_language', ['ar', 'en'])->default('ar');

            // Driver/Supervisor specific
            $table->string('license_number')->unique()->nullable();
            $table->date('license_expiry_date')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('status')->nullable(); // For all roles status enums
            
            // Student specific
            $table->string('full_name')->nullable()->default(null);
            $table->string('full_name_en')->nullable()->default(null);

            $table->string('student_code')->unique()->nullable();
            $table->enum('gender', ['male', 'female'])->nullable();
            $table->string('grade')->nullable();
            $table->foreignId('guardian_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('assigned_supervisor_id')->nullable()->constrained('users')->onDelete('set null');

            $table->foreignId('morning_group_id')->nullable();
            $table->foreignId('afternoon_group_id')->nullable();
            $table->foreignId('forth_route_id')->nullable();
            $table->foreignId('back_route_id')->nullable();

            // School specific
            $table->string('logo')->nullable();
            $table->string('location')->nullable();
            $table->boolean('has_transport')->default(true);
            $table->boolean('has_attendance')->default(true);


            $table->foreignId('school_id')->nullable()->constrained('users')->onDelete('cascade');
            
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable(); // Some users might not have passwords (like students if they don't log in)
            $table->string('fcm_token')->nullable();
            $table->string('onesignal_player_id')->nullable();
            $table->rememberToken();
            $table->timestamps();

            // Indices
            $table->index('role');
            $table->index('is_active');
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
