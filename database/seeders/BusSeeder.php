<?php

namespace Database\Seeders;

use App\Models\Bus;
use App\Models\Driver;
use App\Models\Route;
use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;

class BusSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::first();
        if (!$school) return;

        $supervisors = User::whereHas('roles', fn($q) => $q->where('name', 'field_supervisor'))->get();
        $drivers = User::whereHas('roles', fn($q) => $q->where('name', 'driver'))->get();
        $assistants = User::whereHas('roles', fn($q) => $q->where('name', 'assistant'))->get();

        foreach ($supervisors as $index => $supervisor) {
            $route = Route::firstOrCreate([
                'name' => "المسار رقم " . ($index + 1),
                'code' => "R-" . ($index + 1),
            ]);

            $bus = Bus::updateOrCreate(
                ['bus_number' => "B-" . ($index + 1) . "00"],
                [
                    'school_id' => $school->id,
                    'plate_number' => "ABC-" . rand(1000, 9999),
                    'capacity' => 20,
                    'model' => 'Mercedes',
                    'year' => 2024,
                    'field_supervisor_id' => $supervisor->id,
                    'assistant_id' => $assistants[$index]->id ?? null,
                    'route_id' => $route->id,
                    'status' => 'active',
                ]
            );

            if (isset($drivers[$index])) {
                $driverExtension = Driver::where('user_id', $drivers[$index]->id)->first();
                if ($driverExtension) {
                    $driverExtension->update(['bus_id' => $bus->id]);
                }
            }
        }
    }
}
