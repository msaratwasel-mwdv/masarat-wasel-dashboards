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
        // For PostgreSQL, we might need to drop the constraints if they were created as check constraints for enums
        // Or just change the type to string which effectively removes the enum restriction in Laravel's migration layer
        Schema::table('incidents', function (Blueprint $table) {
            $table->string('type')->change();
            $table->string('status')->default('pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            $table->enum('type', ['sos', 'accident', 'breakdown', 'health'])->change();
            $table->enum('status', ['active', 'in_progress', 'resolved'])->default('active')->change();
        });
    }
};
