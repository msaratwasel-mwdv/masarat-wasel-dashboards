<?php

use App\Models\Bus;
use App\Http\Controllers\Admin\BusController;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = new BusController(new \App\Services\NotificationService()); // Mocking service

$buses = Bus::all();
echo "Regenerating QR codes for " . $buses->count() . " buses...\n";

foreach ($buses as $bus) {
    echo "Bus " . $bus->bus_number . "... ";
    // Use reflection to call private method or just copy-paste logic
    // I'll just use tinker-like approach or run it through the controller if I can
    
    // Actually, I just updated the controller. I can just write a small logic here.
    $busNumber = $bus->bus_number;
    $frontData = "FRONT-" . $bus->id;
    $backData = "BACK-" . $bus->id;
    
    $frontFileName = 'qrcodes/' . $busNumber . '_front.png';
    $backFileName = 'qrcodes/' . $busNumber . '_back.png';
    
    Illuminate\Support\Facades\Storage::disk('public')->makeDirectory('qrcodes');

    try {
        $qrApiUrlFront = "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" . urlencode($frontData) . "&margin=10&format=png";
        $qrApiUrlBack = "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" . urlencode($backData) . "&margin=10&format=png";

        $respFront = Illuminate\Support\Facades\Http::timeout(10)->get($qrApiUrlFront);
        $respBack = Illuminate\Support\Facades\Http::timeout(10)->get($qrApiUrlBack);
        
        if ($respFront->successful() && $respBack->successful()) {
            Illuminate\Support\Facades\Storage::disk('public')->put($frontFileName, $respFront->body());
            Illuminate\Support\Facades\Storage::disk('public')->put($backFileName, $respBack->body());
            
            $bus->update([
                'front_qr' => $frontFileName,
                'back_qr' => $backFileName
            ]);
            echo "Done\n";
        } else {
            echo "Failed API\n";
        }
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

echo "Finished.\n";
