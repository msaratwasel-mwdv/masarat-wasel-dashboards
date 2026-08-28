<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('whatsapp_logs')) {
            Schema::create('whatsapp_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('recipient_phone')->index();
                $table->string('recipient_name')->nullable();
                $table->string('recipient_type')->nullable();
                $table->string('template_name')->index();
                $table->string('event_type')->nullable()->index();
                $table->json('parameters')->nullable();
                $table->text('header_image_url')->nullable();
                $table->string('wamid')->nullable()->index();
                $table->string('status')->default('sent')->index(); // sent, delivered, read, failed, skipped
                $table->text('error_message')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_logs');
    }
};
