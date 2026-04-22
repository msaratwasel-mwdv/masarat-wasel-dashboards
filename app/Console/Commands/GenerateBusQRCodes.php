<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Bus;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class GenerateBusQRCodes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'buses:generate-qr {--force : Force regeneration for all buses}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate QR codes for buses that do not have them or force regeneration for all.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $force = $this->option('force');

        $buses = Bus::all();
        $count = 0;

        $this->info("Found {$buses->count()} buses. Checking for QR codes...");

        foreach ($buses as $bus) {
            if ($force || !$bus->front_qr || !$bus->back_qr) {
                $this->generateQRCodes($bus);
                $this->info("Generated QR codes for Bus #{$bus->bus_number} (ID: {$bus->id})");
                $count++;
            }
        }

        $this->info("Finished! Generated QR codes for {$count} buses.");
    }

    /**
     * Generate QR codes (Front and Back) for the bus.
     */
    private function generateQRCodes(Bus $bus)
    {
        $busNumber = $bus->bus_number;
        $frontData = "FRONT-" . $bus->id;
        $backData = "BACK-" . $bus->id;
        
        $frontFileName = 'qrcodes/' . $busNumber . '_front.png';
        $backFileName = 'qrcodes/' . $busNumber . '_back.png';
        
        Storage::disk('public')->makeDirectory('qrcodes');

        try {
            // Using external API for PNG generation
            $qrApiUrlFront = "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" . urlencode($frontData) . "&margin=10&format=png";
            $qrApiUrlBack = "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" . urlencode($backData) . "&margin=10&format=png";

            $respFront = Http::timeout(10)->get($qrApiUrlFront);
            $respBack = Http::timeout(10)->get($qrApiUrlBack);
            
            if ($respFront->successful() && $respBack->successful()) {
                Storage::disk('public')->put($frontFileName, $respFront->body());
                Storage::disk('public')->put($backFileName, $respBack->body());
                
                $bus->update([
                    'front_qr' => $frontFileName,
                    'back_qr' => $backFileName
                ]);
                return;
            }
        } catch (\Exception $e) {
            // Fallback will happen below
        }

        // Fallback to local SVG generation
        $frontFileNameSvg = 'qrcodes/' . $busNumber . '_front.svg';
        $backFileNameSvg = 'qrcodes/' . $busNumber . '_back.svg';
        
        $qrImageFront = QrCode::format('svg')->size(400)->margin(2)->generate($frontData);
        $qrImageBack = QrCode::format('svg')->size(400)->margin(2)->generate($backData);
        
        Storage::disk('public')->put($frontFileNameSvg, $qrImageFront);
        Storage::disk('public')->put($backFileNameSvg, $qrImageBack);
        
        $bus->update([
            'front_qr' => $frontFileNameSvg,
            'back_qr' => $backFileNameSvg
        ]);
    }
}
