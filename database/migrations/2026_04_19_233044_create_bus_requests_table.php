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
        Schema::create('bus_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            $table->enum('request_type', ['permanent', 'temporary'])->default('temporary');
            $table->foreignId('bus_id')->nullable()->constrained('buses')->onDelete('set null');
            $table->integer('seats')->default(20);
            $table->decimal('cost', 10, 2)->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->text('destination_address')->nullable();
            $table->string('destination_location')->nullable(); // lat, lng
            $table->text('purpose');
            $table->text('details')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bus_requests');
    }
};
