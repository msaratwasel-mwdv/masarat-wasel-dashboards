<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->string('title');
            $table->string('title_en')->nullable();
            $table->text('message');
            $table->text('message_en')->nullable();
            $table->json('data')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('sender_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('from_user_name')->nullable();

            // حقول الإرسال الجماعي
            $table->string('recipient_type')->nullable();
            $table->json('recipient_filter')->nullable();
            $table->string('template_type')->nullable();

            // إحصائيات الإرسال
            $table->integer('total_recipients')->default(0);
            $table->integer('sent_count')->default(0);
            $table->integer('failed_count')->default(0);

            $table->string('status')->default('unread');
            $table->string('icon')->default('bell');
            $table->string('color')->default('blue');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
