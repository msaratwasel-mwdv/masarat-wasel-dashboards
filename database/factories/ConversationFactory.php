<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Conversation>
 */
class ConversationFactory extends Factory
{
    protected $model = Conversation::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'type' => 'private',
            'title' => null,
        ];
    }
}
