<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        Plan::updateOrCreate(['name' => 'Basic'], [
            'description' => 'خطة أساسية للمدارس الناشئة',
            'price_per_student' => 8.00,
            'is_active' => true,
            'max_buses' => 5,
            'has_driver_app' => true,
            'has_parent_app' => true,
            'has_supervisor_app' => false,
            'notifications_limit' => 'limited',
            'has_reports' => true,
            'has_api_access' => false,
            'has_dedicated_support' => false,
            'sort_order' => 1,
            'badge' => null,
            'currency' => 'OMR'
        ]);

        Plan::updateOrCreate(['name' => 'Plus'], [
            'description' => 'خطة متقدمة وشائعة للمدارس',
            'price_per_student' => 9.00,
            'is_active' => true,
            'max_buses' => 10,
            'has_driver_app' => true,
            'has_parent_app' => true,
            'has_supervisor_app' => true,
            'notifications_limit' => 'unlimited',
            'has_reports' => true,
            'has_api_access' => false,
            'has_dedicated_support' => false,
            'sort_order' => 2,
            'badge' => 'شائع',
            'currency' => 'OMR'
        ]);

        Plan::updateOrCreate(['name' => 'premeuim'], [
            'description' => 'خطة مخصصة للمؤسسات التعليمية الكبرى',
            'price_per_student' => 10.00,
            'is_active' => true,
            'max_buses' => null, // unlimited
            'has_driver_app' => true,
            'has_parent_app' => true,
            'has_supervisor_app' => true,
            'notifications_limit' => 'unlimited',
            'has_reports' => true,
            'has_api_access' => true,
            'has_dedicated_support' => true,
            'sort_order' => 3,
            'badge' => null,
            'currency' => 'OMR'
        ]);
    }
}
