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
        Schema::table('notifications', function (Blueprint $table) {
            // إضافة sender_id
            $table->foreignId('sender_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            
            // حقول الإرسال الجماعي
            $table->string('recipient_type')->after('message'); // all_parents, bus_students, etc.
            $table->json('recipient_filter')->nullable()->after('recipient_type');
            $table->string('template_type')->nullable()->after('type');
            
            // إحصائيات الإرسال
            $table->integer('total_recipients')->default(0)->after('recipient_filter');
            $table->integer('sent_count')->default(0)->after('total_recipients');
            $table->integer('failed_count')->default(0)->after('sent_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['sender_id']);
            $table->dropColumn([
                'sender_id',
                'recipient_type',
                'recipient_filter',
                'template_type',
                'total_recipients',
                'sent_count',
                'failed_count',
            ]);
        });
    }
};
