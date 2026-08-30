<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $events = [
            [
                'title_ar' => 'ورشة عمل تدريب السائقين الجدد',
                'title_en' => 'New Drivers Training Workshop',
                'content_ar' => 'أقامت مسارات واصل ورشة عمل مكثفة لتدريب السائقين الجدد على أحدث معايير السلامة واستخدام التطبيق.',
                'content_en' => 'Masarat Wasel hosted an intensive workshop to train new drivers on the latest safety standards and app usage.',
                'type' => 'workshop',
                'tag_ar' => 'ورش العمل',
                'tag_en' => 'Workshops',
                'image' => null, // We'll use a placeholder in frontend
                'event_date' => now()->subDays(5),
                'is_published' => true,
            ],
            [
                'title_ar' => 'استعراض الأسطول الحديث لحافلات واصل',
                'title_en' => 'Showcase of Modern Wasel Fleet',
                'content_ar' => 'نفتخر بالإعلان عن انضمام أكثر من 50 حافلة حديثة ومجهزة بأحدث وسائل الأمان إلى أسطولنا.',
                'content_en' => 'We are proud to announce the addition of over 50 modern buses equipped with the latest safety features to our fleet.',
                'type' => 'bus_photos',
                'tag_ar' => 'صور الحافلات',
                'tag_en' => 'Bus Photos',
                'image' => null,
                'event_date' => now()->subDays(12),
                'is_published' => true,
            ],
            [
                'title_ar' => 'تغطية الأنشطة المدرسية والرحلات',
                'title_en' => 'School Activities and Trips Coverage',
                'content_ar' => 'ساهمت مسارات واصل في إنجاح رحلة مدرسية لأكثر من 200 طالب إلى المعالم السياحية في مسقط.',
                'content_en' => 'Masarat Wasel contributed to the success of a school trip for over 200 students to tourist landmarks in Muscat.',
                'type' => 'activity',
                'tag_ar' => 'فعاليات الشركة',
                'tag_en' => 'Company Events',
                'image' => null,
                'event_date' => now()->subDays(20),
                'is_published' => true,
            ],
            [
                'title_ar' => 'إطلاق التحديث الجديد لتطبيق مسارات واصل',
                'title_en' => 'Launch of the New Wasel App Update',
                'content_ar' => 'نعلن عن إطلاق الإصدار 2.0 من تطبيق مسارات واصل الذي يضم تحسينات شاملة لواجهة المستخدم والتتبع المباشر.',
                'content_en' => 'We announce the launch of version 2.0 of the Masarat Wasel app, featuring comprehensive UI improvements and live tracking.',
                'type' => 'news',
                'tag_ar' => 'أخبار تقنية',
                'tag_en' => 'Tech News',
                'image' => null,
                'event_date' => now()->subDays(2),
                'is_published' => true,
            ],
            [
                'title_ar' => 'تكريم السائقين المتميزين للربع الأول',
                'title_en' => 'Honoring Outstanding Drivers of Q1',
                'content_ar' => 'تم تكريم مجموعة من السائقين المتميزين لالتزامهم بأعلى معايير السلامة والانضباط خلال الربع الأول من العام.',
                'content_en' => 'A group of outstanding drivers were honored for their commitment to the highest safety and discipline standards during Q1.',
                'type' => 'news',
                'tag_ar' => 'أخبار الشركة',
                'tag_en' => 'Company News',
                'image' => null,
                'event_date' => now()->subDays(30),
                'is_published' => true,
            ],
            [
                'title_ar' => 'توقيع اتفاقية شراكة استراتيجية',
                'title_en' => 'Signing a Strategic Partnership Agreement',
                'content_ar' => 'وقعت شركة مسارات واصل اتفاقية استراتيجية مع إحدى كبرى المدارس لتقديم خدمات النقل الذكي لطلابها.',
                'content_en' => 'Masarat Wasel signed a strategic agreement with one of the largest schools to provide smart transport services to its students.',
                'type' => 'news',
                'tag_ar' => 'أخبار الشركة',
                'tag_en' => 'Company News',
                'image' => null,
                'event_date' => now()->subDays(45),
                'is_published' => true,
            ],
        ];

        foreach ($events as $event) {
            \App\Models\Event::create($event);
        }
    }
}
