<?php

namespace Database\Factories;

use App\Models\SystemSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SystemSetting>
 */
class SystemSettingFactory extends Factory
{
    protected $model = SystemSetting::class;

    public function definition(): array
    {
        return [
            'key' => 'setting_'.fake()->unique()->slug(2),
            'value' => 'true',
            'group' => 'general',
            'type' => 'boolean',
            'description' => 'إعداد نظام تجريبي',
        ];
    }
}
