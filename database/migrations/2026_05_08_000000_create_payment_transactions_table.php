<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 12, 2);
            $table->string('payment_method');
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('paid_at');
            $table->timestamps();
        });

        // Link installments to transactions via many-to-many to track which payment covered which installments
        Schema::create('installment_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_transaction_id')->constrained()->onDelete('cascade');
            $table->foreignId('installment_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
