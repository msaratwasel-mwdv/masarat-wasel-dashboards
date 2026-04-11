<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Roles System
        |--------------------------------------------------------------------------
        */

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // driver, parent, admin...
        });

        Schema::create('user_roles', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();

            $table->primary(['user_id', 'role_id']);
        });

        /*
        |--------------------------------------------------------------------------
        | Role-Specific Tables (1:1 with users)
        |--------------------------------------------------------------------------
        */

        // 1. School Admins
        Schema::create('school_admins', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        // 2. Field Supervisors (المشرف الميداني)
        Schema::create('field_supervisors', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('fcm_token')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        // 3. Teachers
        Schema::create('teachers', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->foreignId('school_id')->nullable()->constrained()->nullOnDelete();

            $table->foreignId('classroom_id')
                  ->nullable()
                  ->constrained('classrooms')
                  ->nullOnDelete();
            $table->string('fcm_token')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        // 4. Assistants (المشرفة)
        Schema::create('assistants', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('fcm_token')->nullable();

            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();

            $table->enum('status', ['active', 'inactive'])->default('active');

            $table->timestamps();
        });

        // 5. Drivers
        Schema::create('drivers', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();

            $table->string('fcm_token')->nullable();
            $table->string('license_number')->unique();
            $table->date('license_expiry_date');

            $table->enum('status', ['active', 'inactive'])->default('active');

            $table->foreignId('bus_id')
                  ->nullable()
                  ->constrained('buses')
                  ->nullOnDelete();

            $table->timestamps();
        });

        // 6. Guardians (Parents)
        Schema::create('guardians', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('fcm_token')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        // Add foreign keys back to buses which reference these newly created tables
        Schema::table('buses', function (Blueprint $table) {
            $table->foreign('assistant_id')->references('user_id')->on('assistants')->nullOnDelete();
            $table->foreign('field_supervisor_id')->references('user_id')->on('field_supervisors')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guardians');
        Schema::dropIfExists('drivers');
        Schema::dropIfExists('assistants');
        Schema::dropIfExists('teachers');
        Schema::dropIfExists('field_supervisors');
        Schema::dropIfExists('school_admins');

        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('roles');
    }
};
