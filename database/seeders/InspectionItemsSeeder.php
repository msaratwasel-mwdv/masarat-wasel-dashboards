<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class InspectionItemsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            ['name' => 'توفر طفاية حريق صالحة'],
            ['name' => 'نظافة الحافلة من الداخل'],
            ['name' => 'سلامة الإطارات'],
            ['name' => 'سلامة المقاعد'],
            ['name' => 'عمل المكيف بشكل جيد'],
            ['name' => 'سلامة الإضاءة الخارجية والداخلية'],
            ['name' => 'توفر حقيبة الإسعافات الأولية'],
            ['name' => 'ظافة الحافلة من الخارج'],
        ];

        foreach ($items as $item) {
            \App\Models\InspectionItem::firstOrCreate($item);
        }
    }
}
