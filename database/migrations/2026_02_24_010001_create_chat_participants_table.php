<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role')->nullable();              // parent, driver, supervisor
            $table->timestamp('last_read_at')->nullable();   // آخر وقت قراءة
            $table->timestamps();

            $table->unique(['conversation_id', 'user_id']);   // كل مستخدم مرة واحدة في المحادثة
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_participants');
    }
};
