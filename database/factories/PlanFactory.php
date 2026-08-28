<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Plan>
 */
class PlanFactory extends Factory
{
    protected $model = Plan::class;

    public function definition(): array
    {
        return [
            'name' => 'الخطة '.fake('ar_SA')->word(),
            'description' => 'خطة شاملة لإدارة النقل المدرسي والحضور',
            'price_per_student' => 50.00,
            'is_active' => true,
            'max_buses' => 20,
            'has_driver_app' => true,
            'has_parent_app' => true,
            'has_supervisor_app' => true,
            'notifications_limit' => '1000',
            'has_reports' => true,
            'has_api_access' => true,
            'has_dedicated_support' => true,
            'sort_order' => 1,
            'currency' => 'SAR',
        ];
    }
}
