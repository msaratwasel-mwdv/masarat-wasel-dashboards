<?php

namespace Tests\Feature\Api;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\School;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Tests\Traits\CreatesUsers;

class ChatApiControllerTest extends TestCase
{
    use CreatesUsers;

    public function test_admin_can_fetch_contacts_and_conversations(): void
    {
        $admin = $this->createAdmin();
        $otherUser = $this->createDriver();

        Sanctum::actingAs($admin, ['*']);

        $responseContacts = $this->getJson('/api/chat/contacts');
        $responseContacts->assertStatus(200);

        $responseConv = $this->getJson('/api/chat/conversations');
        $responseConv->assertStatus(200);
    }

    public function test_admin_can_start_conversation_and_send_message(): void
    {
        $school = School::factory()->create();
        $admin = $this->createAdmin();
        $driver = $this->createDriver();
        \App\Models\Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
        ]);

        Sanctum::actingAs($admin, ['*']);

        // 1. Start Conversation
        $responseStart = $this->postJson('/api/chat/conversations', [
            'receiver_id' => $driver->id,
        ]);
        $responseStart->assertStatus(200);

        $conversationId = $responseStart->json('data.id');
        $this->assertNotNull($conversationId);

        // 2. Send Message
        $responseSend = $this->postJson("/api/chat/conversations/{$conversationId}/messages", [
            'body' => 'يرجى الالتزام بالمسار المحدد اليوم',
            'type' => 'text',
        ]);
        $responseSend->assertSuccessful();

        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversationId,
            'sender_id' => $admin->id,
            'body' => 'يرجى الالتزام بالمسار المحدد اليوم',
        ]);

        // 3. Get Messages
        $responseMessages = $this->getJson("/api/chat/conversations/{$conversationId}/messages");
        $responseMessages->assertStatus(200);

        // 4. Mark as read
        $responseRead = $this->postJson("/api/chat/conversations/{$conversationId}/read");
        $responseRead->assertStatus(200);
    }
}
