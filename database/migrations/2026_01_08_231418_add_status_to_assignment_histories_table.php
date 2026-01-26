<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('assignment_histories', function (Blueprint $table) {
            // نضيفها لتتبع تغيير الحالة (Active <-> Maintenance)
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();

            // أو ملاحظات إضافية (مثل سبب الأرشفة)
            $table->string('notes')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assignment_histories', function (Blueprint $table) {
            //
        });
    }
};
