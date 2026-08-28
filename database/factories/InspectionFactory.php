<?php

namespace Database\Factories;

use App\Models\Bus;
use App\Models\Inspection;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Inspection>
 */
class InspectionFactory extends Factory
{
    protected $model = Inspection::class;

    public function definition(): array
    {
        return [
            'field_supervisor_id' => User::factory(),
            'bus_id' => Bus::factory(),
            'overall_status' => 'pass',
            'notes' => 'الفحص الدوري مكتمل وجميع شروط السلامة متوفرة',
            'photos' => null,
        ];
    }
}
