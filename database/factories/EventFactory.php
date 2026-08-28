<?php

namespace Database\Factories;

use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition(): array
    {
        return [
            'title_ar' => fake('ar_SA')->sentence(4),
            'title_en' => fake('en_US')->sentence(4),
            'content_ar' => fake('ar_SA')->paragraph(),
            'content_en' => fake('en_US')->paragraph(),
            'type' => fake()->randomElement(['news', 'event', 'announcement']),
            'tag_ar' => 'أخبار',
            'tag_en' => 'News',
            'image' => null,
            'event_date' => now()->addDays(7)->toDateString(),
            'is_published' => true,
        ];
    }
}
