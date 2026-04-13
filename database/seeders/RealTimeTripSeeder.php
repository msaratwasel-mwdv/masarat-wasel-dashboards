<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RealTimeTripSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $buses = \App\Models\Bus::all();
        $routes = \App\Models\Route::all();
        $drivers = \App\Models\User::whereHas('roles', fn($q) => $q->where('name', 'driver'))->get();
        $assistants = \App\Models\User::whereHas('roles', fn($q) => $q->where('name', 'assistant'))->get();

        if ($buses->isEmpty()) return;

        $today = \Carbon\Carbon::today();

        foreach ($buses as $index => $bus) {
            // Morning trip
            \App\Models\Trip::updateOrCreate(
                ['bus_id' => $bus->id, 'trip_date' => $today->toDateString(), 'type' => 'forth'],
                [
                    'status' => 'finished',
                    'departure_time' => $today->copy()->setTime(7, 0, 0),
                    'arrival_time' => $today->copy()->setTime(8, 0, 0),
                    'video_check' => true,
                ]
            );

            // Afternoon trip
            \App\Models\Trip::updateOrCreate(
                ['bus_id' => $bus->id, 'trip_date' => $today->toDateString(), 'type' => 'back'],
                [
                    'status' => $index % 2 == 0 ? 'in_progress' : 'pending',
                    'departure_time' => $today->copy()->setTime(14, 0, 0),
                    'video_check' => false,
                ]
            );
        }
    }
}
