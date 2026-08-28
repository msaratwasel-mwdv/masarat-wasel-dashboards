<?php

namespace Tests\Unit\Models;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\NotificationTemplate;
use App\Models\School;
use App\Models\User;
use Tests\TestCase;

class ChatAndNotificationModelTest extends TestCase
{
    public function test_conversation_and_messages_system(): void
    {
        $school = School::factory()->create();
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $conversation = Conversation::factory()->create([
            'school_id' => $school->id,
            'type' => 'private',
        ]);

        $conversation->participants()->attach([
            $user1->id => ['role' => 'member'],
            $user2->id => ['role' => 'member'],
        ]);

        $msg1 = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user1->id,
            'body' => 'رسالة أولى',
        ]);

        $msg2 = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user2->id,
            'body' => 'رسالة ثانية',
        ]);

        $this->assertEquals(2, $conversation->participants()->count());
        $this->assertEquals(2, $conversation->messages()->count());
        $this->assertEquals($msg2->id, $conversation->lastMessage->id);

        $found = Conversation::findBetween($user1->id, $user2->id);
        $this->assertNotNull($found);
        $this->assertEquals($conversation->id, $found->id);
    }

    public function test_notification_and_recipients_relationships(): void
    {
        $sender = User::factory()->create();
        $recipientUser = User::factory()->create();

        $notification = Notification::factory()->create([
            'sender_id' => $sender->id,
            'user_id' => $recipientUser->id,
            'status' => 'unread',
        ]);

        $recipientRecord = NotificationRecipient::create([
            'notification_id' => $notification->id,
            'user_id' => $recipientUser->id,
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        $this->assertEquals($sender->id, $notification->sender->id);
        $this->assertEquals($recipientUser->id, $notification->user->id);
        $this->assertTrue($notification->recipients->contains('id', $recipientRecord->id));

        $this->assertTrue($notification->isUnread());
        $notification->markAsRead();
        $this->assertFalse($notification->isUnread());
        $this->assertEquals('read', $notification->status);
    }

    public function test_notification_template_model(): void
    {
        $template = NotificationTemplate::create([
            'name_ar' => 'ركوب الحافلة',
            'name_en' => 'Bus Boarded',
            'title_ar' => 'ركوب الطالب',
            'title_en' => 'Student Boarded',
            'body_ar' => 'ركب الطالب {student_name} الحافلة',
            'body_en' => 'Student {student_name} boarded the bus',
            'type' => 'student_boarded',
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('notification_templates', ['id' => $template->id]);
        $this->assertTrue(NotificationTemplate::active()->get()->contains('id', $template->id));
    }
}
