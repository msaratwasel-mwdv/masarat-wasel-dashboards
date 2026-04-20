<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BusExpenseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $buses = \App\Models\Bus::all();
        
        foreach ($buses as $bus) {
            // Fuel expense
            \App\Models\BusExpense::create([
                'bus_id' => $bus->id,
                'type' => 'fuel',
                'amount' => rand(50, 200),
                'date' => now()->subDays(rand(1, 10)),
                'extra_info' => (string)rand(10000, 50000), // Odometer reading
            ]);

            // Maintenance expense
            \App\Models\BusExpense::create([
                'bus_id' => $bus->id,
                'type' => 'maintenance',
                'amount' => rand(100, 500),
                'date' => now()->subDays(rand(11, 30)),
                'extra_info' => 'Oil change and filter replacement', // Description
            ]);
        }
    }
}
