<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        Plan::updateOrCreate(['name' => 'Basic'], [
            'name_ar' => 'الباقة الأساسية',
            'name_en' => 'Basic Plan',
            'description' => 'خطة أساسية للمدارس الناشئة والصغيرة.',
            'description_ar' => 'خطة أساسية للمدارس الناشئة والصغيرة لتنظيم الرحلات بيسر.',
            'description_en' => 'Basic plan for emerging and small schools to organize trips easily.',
            'price_per_student' => 8.00,
            'price_per_student_yearly' => 80.00,
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
            'badge_ar' => null,
            'badge_en' => null,
            'currency' => 'OMR',
        ]);

        Plan::updateOrCreate(['name' => 'Plus'], [
            'name_ar' => 'باقة بلس',
            'name_en' => 'Plus Plan',
            'description' => 'خطة متقدمة وشائعة للمدارس المتوسطة.',
            'description_ar' => 'خطة متقدمة وشائعة للمدارس المتوسطة التي تطلب ميزات شاملة.',
            'description_en' => 'An advanced and popular plan for mid-sized schools requiring comprehensive features.',
            'price_per_student' => 9.00,
            'price_per_student_yearly' => 90.00,
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
            'badge_ar' => 'الأكثر طلباً',
            'badge_en' => 'Most Popular',
            'currency' => 'OMR',
        ]);

        Plan::updateOrCreate(['name' => 'Premium'], [
            'name_ar' => 'الباقة المميزة',
            'name_en' => 'Premium Plan',
            'description' => 'خطة مخصصة للمؤسسات التعليمية الكبرى.',
            'description_ar' => 'خطة مخصصة للمؤسسات التعليمية الكبرى التي تبحث عن أقصى درجات التحكم.',
            'description_en' => 'A dedicated plan for large educational institutions seeking maximum control.',
            'price_per_student' => 10.00,
            'price_per_student_yearly' => 100.00,
            'is_active' => true,
            'max_buses' => null,
            'has_driver_app' => true,
            'has_parent_app' => true,
            'has_supervisor_app' => true,
            'notifications_limit' => 'unlimited',
            'has_reports' => true,
            'has_api_access' => true,
            'has_dedicated_support' => true,
            'sort_order' => 3,
            'badge_ar' => null,
            'badge_en' => null,
            'currency' => 'OMR',
        ]);
    }
}
