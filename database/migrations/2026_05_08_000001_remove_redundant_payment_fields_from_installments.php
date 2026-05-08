<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('installments', function (Blueprint $table) {
            $table->dropColumn(['paid_at', 'payment_method', 'reference_number']);
        });
    }

    public function down(): void
    {
        Schema::table('installments', function (Blueprint $table) {
            $table->datetime('paid_at')->nullable();
            $table->string('payment_method')->nullable();
            $table->string('reference_number')->nullable();
        });
    }
};
