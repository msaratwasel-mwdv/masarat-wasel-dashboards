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
        // Add WhatsApp consent to users
        Schema::table('users', function (Blueprint $blueprint) {
            $blueprint->boolean('whatsapp_consent')->default(false)->after('phone');
        });

        // WhatsApp Accounts (Single account setup)
        Schema::create('whatsapp_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('waba_id'); // WhatsApp Business Account ID
            $table->string('phone_number_id'); // Phone Number ID
            $table->string('display_phone'); // The phone number itself
            $table->text('access_token'); // Encrypted
            $table->string('webhook_verify_token')->nullable();
            $table->string('app_secret')->nullable();
            $table->enum('status', ['active', 'inactive', 'pending'])->default('pending');
            $table->string('messaging_tier')->default('tier_1');
            $table->timestamps();
        });

        // WhatsApp Templates (Sync from Meta)
        Schema::create('whatsapp_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('whatsapp_account_id')->constrained()->onDelete('cascade');
            $table->string('meta_template_id')->nullable();
            $table->string('name'); // meta name
            $table->string('language')->default('ar');
            $table->enum('category', ['MARKETING', 'UTILITY', 'AUTHENTICATION'])->default('UTILITY');
            $table->enum('status', ['APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'DISABLED'])->default('PENDING');
            $table->json('components'); // Raw structure
            $table->string('quality_score')->nullable();
            $table->timestamps();
        });

        // Variable Mapping for Template Placeholders
        Schema::create('whatsapp_template_variables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('whatsapp_template_id')->constrained()->onDelete('cascade');
            $table->smallInteger('position'); // {{1}}, {{2}}...
            $table->enum('component_type', ['HEADER', 'BODY', 'BUTTON'])->default('BODY');
            $table->string('source_model'); // Context model
            $table->string('source_attribute'); // Dot notation path
            $table->string('fallback_value')->nullable();
            $table->timestamps();
        });

        // Event Bindings (Which event triggers which template)
        Schema::create('whatsapp_event_bindings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('whatsapp_template_id')->constrained()->onDelete('cascade');
            $table->string('event_name'); // Laravel event class name
            $table->string('target_role'); // parent, driver, assistant
            $table->string('recipient_resolver'); // Method in subscriber to find phone
            $table->boolean('is_active')->default(true);
            $table->json('conditions')->nullable();
            $table->timestamps();
        });

        // Message Logs
        Schema::create('whatsapp_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('whatsapp_account_id')->constrained();
            $table->foreignId('whatsapp_template_id')->nullable()->constrained();
            $table->string('meta_message_id')->nullable()->index();
            $table->string('recipient_phone');
            $table->foreignId('recipient_user_id')->nullable()->constrained('users');
            $table->enum('direction', ['outbound', 'inbound'])->default('outbound');
            $table->enum('status', ['queued', 'sent', 'delivered', 'read', 'failed'])->default('queued');
            $table->json('template_variables_snapshot')->nullable();
            $table->json('error_payload')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_messages');
        Schema::dropIfExists('whatsapp_event_bindings');
        Schema::dropIfExists('whatsapp_template_variables');
        Schema::dropIfExists('whatsapp_templates');
        Schema::dropIfExists('whatsapp_accounts');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('whatsapp_consent');
        });
    }
};
