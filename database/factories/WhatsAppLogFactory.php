<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\WhatsAppLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WhatsAppLog>
 */
class WhatsAppLogFactory extends Factory
{
    protected $model = WhatsAppLog::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'recipient_phone' => fake()->numerify('9665########'),
            'recipient_name' => fake('ar_SA')->name(),
            'recipient_type' => 'parent',
            'template_name' => 'student_bus_status',
            'event_type' => 'student_boarded',
            'parameters' => ['أحمد', '101'],
            'wamid' => 'wamid.'.fake()->unique()->uuid(),
            'status' => 'sent',
            'sent_at' => now(),
        ];
    }
}
