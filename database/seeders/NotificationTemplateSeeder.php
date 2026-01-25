<?php

namespace Database\Seeders;

use App\Models\NotificationTemplate;
use Illuminate\Database\Seeder;

class NotificationTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'name_ar' => 'تأخير الحافلة',
                'name_en' => 'Bus Delay',
                'title_ar' => 'تأخير في وصول الحافلة',
                'title_en' => 'Bus Delay Notification',
                'body_ar' => 'عزيزي ولي الأمر، نود إعلامكم بتأخر وصول الحافلة رقم {bus_number} لمدة {delay_minutes} دقيقة بسبب {reason}.',
                'body_en' => 'Dear parent, we would like to inform you that bus number {bus_number} is delayed by {delay_minutes} minutes due to {reason}.',
                'type' => 'bus_delay',
                'is_active' => true,
            ],
            [
                'name_ar' => 'تغيير مسار الحافلة',
                'name_en' => 'Route Change',
                'title_ar' => 'تغيير في مسار الحافلة',
                'title_en' => 'Bus Route Change',
                'body_ar' => 'تم تغيير مسار الحافلة رقم {bus_number}. المسار الجديد: {new_route}',
                'body_en' => 'The route for bus number {bus_number} has been changed. New route: {new_route}',
                'type' => 'route_change',
                'is_active' => true,
            ],
            [
                'name_ar' => 'رحلة ميدانية',
                'name_en' => 'Field Trip',
                'title_ar' => 'رحلة ميدانية قادمة',
                'title_en' => 'Upcoming Field Trip',
                'body_ar' => 'رحلة ميدانية إلى {destination} بتاريخ {date}. يرجى التأكيد على الحضور.',
                'body_en' => 'Field trip to {destination} on {date}. Please confirm attendance.',
                'type' => 'field_trip',
                'is_active' => true,
            ],
            [
                'name_ar' => 'إغلاق المدرسة',
                'name_en' => 'School Closure',
                'title_ar' => 'إغلاق المدرسة',
                'title_en' => 'School Closure Notice',
                'body_ar' => 'تم إغلاق المدرسة يوم {date} بسبب {reason}',
                'body_en' => 'School will be closed on {date} due to {reason}',
                'type' => 'school_closure',
                'is_active' => true,
            ],
            [
                'name_ar' => 'غياب طالب عن الحافلة',
                'name_en' => 'Student Absence from Bus',
                'title_ar' => 'إشعار غياب عن الحافلة',
                'title_en' => 'Bus Absence Notification',
                'body_ar' => 'الطالب {student_name} لم يحضر في الحافلة اليوم.',
                'body_en' => 'Student {student_name} was absent from the bus today.',
                'type' => 'student_absence',
                'is_active' => true,
            ],
            [
                'name_ar' => 'وصول الحافلة للمدرسة',
                'name_en' => 'Bus Arrival at School',
                'title_ar' => 'وصول الحافلة',
                'title_en' => 'Bus Arrival',
                'body_ar' => 'وصلت الحافلة رقم {bus_number} إلى المدرسة. جميع الطلاب بأمان.',
                'body_en' => 'Bus number {bus_number} has arrived at school. All students are safe.',
                'type' => 'bus_arrival',
                'is_active' => true,
            ],
            [
                'name_ar' => 'مغادرة الحافلة من المدرسة',
                'name_en' => 'Bus Departure from School',
                'title_ar' => 'مغادرة الحافلة',
                'title_en' => 'Bus Departure',
                'body_ar' => 'غادرت الحافلة رقم {bus_number} من المدرسة. الوصول المتوقع: {eta}',
                'body_en' => 'Bus number {bus_number} has departed from school. Estimated arrival: {eta}',
                'type' => 'bus_departure',
                'is_active' => true,
            ],
        ];

        foreach ($templates as $template) {
            NotificationTemplate::create($template);
        }

        $this->command->info('✅ Notification templates seeded successfully!');
    }
}
