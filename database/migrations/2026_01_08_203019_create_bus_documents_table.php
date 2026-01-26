<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bus_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bus_id')->constrained()->onDelete('cascade');

            $table->string('type'); // 'registration', 'insurance', 'photo_front', 'photo_side'
            $table->string('file_path'); // مسار الملف
            $table->date('expiry_date')->nullable(); // لتنبيهات انتهاء الاستمارة/التأمين

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bus_documents');
    }
};
