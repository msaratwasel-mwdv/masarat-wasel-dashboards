<?php

namespace Tests\Unit\Models;

use App\Models\Bus;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Role;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Tests\TestCase;
use Tests\Traits\CreatesUsers;

class UserModelTest extends TestCase
{
    use CreatesUsers;

    public function test_user_can_have_roles_assigned_and_checked(): void
    {
        $user = User::factory()->create();
        $adminRole = Role::firstOrCreate(['name' => 'admin']);

        $user->roles()->attach($adminRole);
        $user->load('roles');

        $this->assertTrue($user->hasRole('admin'));
        $this->assertFalse($user->hasRole('driver'));
        $this->assertEquals('admin', $user->role);
    }

    public function test_user_full_name_attribute_in_arabic_and_english(): void
    {
        $user = User::factory()->create([
            'first_name_ar' => 'محمد',
            'last_name_ar' => 'الغامدي',
            'first_name_en' => 'Mohammed',
            'last_name_en' => 'Alghamdi',
        ]);

        app()->setLocale('ar');
        $this->assertEquals('محمد الغامدي', $user->name);

        app()->setLocale('en');
        $this->assertEquals('Mohammed Alghamdi', $user->name);
        $this->assertEquals('Mohammed Alghamdi', $user->name_en);
    }

    public function test_parse_full_name_helper(): void
    {
        $parsed = User::parseFullName('خالد عبد الله السعيد');
        $this->assertEquals('خالد', $parsed[0]);
        $this->assertEquals('عبد الله السعيد', $parsed[3]);

        $empty = User::parseFullName(null);
        $this->assertEquals(['', '', '', ''], $empty);
    }

    public function test_get_school_id_for_school_admin_and_teacher(): void
    {
        $school = School::factory()->create();
        $schoolAdmin = $this->createSchoolAdmin($school);
        $this->assertEquals($school->id, $schoolAdmin->getSchoolId());

        $teacher = $this->createTeacher($school);
        $this->assertEquals($school->id, $teacher->getSchoolId());
    }

    public function test_get_school_id_for_driver_via_assigned_bus(): void
    {
        $school = School::factory()->create();
        $driver = $this->createDriver();

        Bus::factory()->create([
            'school_id' => $school->id,
            'driver_id' => $driver->id,
        ]);

        $this->assertEquals($school->id, $driver->getSchoolId());
    }

    public function test_user_fcm_token_management(): void
    {
        $user = User::factory()->create();

        $user->updateFcmToken('sample_token_123', 'android', 'Pixel 8', 'device_001');

        $this->assertDatabaseHas('fcm_tokens', [
            'user_id' => $user->id,
            'token' => 'sample_token_123',
            'device_id' => 'device_001',
        ]);

        $this->assertEquals('sample_token_123', $user->fcm_token);
        $this->assertContains('sample_token_123', $user->routeNotificationForFcm());
    }

    public function test_user_can_have_guardian_students_relationship(): void
    {
        $guardian = $this->createGuardian();
        $student = Student::factory()->create();

        $guardian->students()->attach($student->id, ['relationship_type' => 'father']);

        $this->assertTrue($guardian->students->contains('id', $student->id));
        $this->assertEquals('father', $guardian->students->first()->pivot->relationship_type);
    }

    public function test_user_conversations_and_messages_relationships(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->create();

        $user->conversations()->attach($conversation->id, ['role' => 'member']);
        $message = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'body' => 'مرحباً بالجميع',
        ]);

        $this->assertTrue($user->conversations->contains('id', $conversation->id));
        $this->assertTrue($user->sentMessages->contains('id', $message->id));
    }
}
