<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Bus;
use App\Models\BusExpense;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

DB::beginTransaction();
try {
    $buses = Bus::all();
    if ($buses->isEmpty()) {
        echo "No buses found!\n";
        exit;
    }

    $faker = \Faker\Factory::create('ar_SA');
    $expenseTypes = ['fuel', 'maintenance', 'other'];
    $imageUrls = [
        'https://i.ibb.co/311W9j8/invoice-dummy-1.png', // Just some placeholders
        'https://i.ibb.co/Ltb2K27/invoice-dummy-2.png',
        null, // Sometimes no image
        null
    ];

    $count = 0;
    $now = Carbon::now();

    foreach ($buses as $bus) {
        // Generate expenses for the last 6 months
        for ($i = 0; $i < 6; $i++) {
            $monthStart = $now->copy()->subMonths($i)->startOfMonth();
            $monthEnd = $now->copy()->subMonths($i)->endOfMonth();
            if ($monthEnd->isFuture()) {
                $monthEnd = $now; // don't go into future days of current month
            }

            // 3-5 Fuel expenses per month
            $fuelCount = rand(3, 5);
            for ($f = 0; $f < $fuelCount; $f++) {
                $date = $faker->dateTimeBetween($monthStart, $monthEnd);
                BusExpense::create([
                    'bus_id' => $bus->id,
                    'type' => 'fuel',
                    'amount' => rand(15, 45) + (rand(0, 99) / 100),
                    'date' => $date,
                    'extra_info' => 'تعبئة ديزل من محطة ' . $faker->city,
                    'receipt_photo' => $imageUrls[array_rand($imageUrls)],
                ]);
                $count++;
            }

            // 0-2 Maintenance expenses per month
            $maintCount = rand(0, 2);
            for ($m = 0; $m < $maintCount; $m++) {
                $date = $faker->dateTimeBetween($monthStart, $monthEnd);
                BusExpense::create([
                    'bus_id' => $bus->id,
                    'type' => 'maintenance',
                    'amount' => rand(50, 300) + (rand(0, 99) / 100),
                    'date' => $date,
                    'extra_info' => 'تغيير زيت وفلاتر وصيانة دورية',
                    'receipt_photo' => $imageUrls[array_rand($imageUrls)],
                ]);
                $count++;
            }

            // 0-1 Other expenses per month
            $otherCount = rand(0, 1);
            for ($o = 0; $o < $otherCount; $o++) {
                $date = $faker->dateTimeBetween($monthStart, $monthEnd);
                BusExpense::create([
                    'bus_id' => $bus->id,
                    'type' => 'other',
                    'amount' => rand(10, 50) + (rand(0, 99) / 100),
                    'date' => $date,
                    'extra_info' => 'غسيل وتنظيف الحافلة',
                    'receipt_photo' => $imageUrls[array_rand($imageUrls)],
                ]);
                $count++;
            }
        }
    }

    DB::commit();
    echo "Successfully created $count dummy expenses!\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}
