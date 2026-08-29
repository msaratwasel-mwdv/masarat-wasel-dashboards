<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained()->onDelete('cascade');
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['active', 'expired', 'cancelled', 'paused', 'pending_approval', 'trial'])->default('active');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('final_price', 10, 2)->nullable();
            $table->datetime('grace_period_ends_at')->nullable();
            $table->json('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
