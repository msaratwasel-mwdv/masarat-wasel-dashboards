<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Notification>
 */
class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'type' => 'general',
            'title' => fake('ar_SA')->sentence(3),
            'title_en' => fake('en_US')->sentence(3),
            'message' => fake('ar_SA')->paragraph(),
            'message_en' => fake('en_US')->paragraph(),
            'data' => null,
            'sender_id' => User::factory(),
            'user_id' => User::factory(),
            'status' => 'unread',
        ];
    }
}
