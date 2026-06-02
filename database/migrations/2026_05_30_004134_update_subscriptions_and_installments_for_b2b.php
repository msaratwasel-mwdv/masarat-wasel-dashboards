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
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->decimal('final_price', 10, 2)->nullable()->after('end_date');
            $table->datetime('grace_period_ends_at')->nullable()->after('final_price');
        });

        Schema::table('installments', function (Blueprint $table) {
            $table->string('receipt_path')->nullable()->after('reference_number');
            $table->string('verification_status')->default('none')->after('receipt_path')->comment('none, pending, verified, rejected');
            $table->text('admin_note')->nullable()->after('verification_status');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['final_price', 'grace_period_ends_at']);
        });

        Schema::table('installments', function (Blueprint $table) {
            $table->dropColumn(['receipt_path', 'verification_status', 'admin_note']);
        });
    }
};
