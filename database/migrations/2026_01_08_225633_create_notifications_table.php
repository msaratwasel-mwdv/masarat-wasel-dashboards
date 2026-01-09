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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // 'bus_request', 'field_trip', etc.
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); // Extra data (bus_request_id, school_name, etc.)
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade'); // To whom (admin)
            $table->string('from_user_name')->nullable(); // School name/user who created it
            $table->string('status')->default('unread'); // unread, read
            $table->string('icon')->default('bell'); // Icon to display
            $table->string('color')->default('blue'); // Color theme
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
