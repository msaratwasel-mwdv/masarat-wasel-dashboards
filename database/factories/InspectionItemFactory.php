<?php

namespace Database\Factories;

use App\Models\InspectionItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InspectionItem>
 */
class InspectionItemFactory extends Factory
{
    protected $model = InspectionItem::class;

    public function definition(): array
    {
        return [
            'name' => 'فحص '.fake('ar_SA')->word(),
            'is_active' => true,
            'order_index' => 1,
        ];
    }
}
