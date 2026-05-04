<?php

namespace App\Services;

use yidas\googleMaps\Client;
use Illuminate\Support\Facades\Log;

class GoogleMapsService
{
    protected ?Client $client = null;

    public function __construct()
    {
        $key = env('Maps_API_KEY');
        if ($key) {
            try {
                $this->client = new Client(['key' => $key]);
            } catch (\Exception $e) {
                Log::error("Google Maps Client Init Error: " . $e->getMessage());
            }
        } else {
            Log::warning("Google Maps API Key missing in .env (Maps_API_KEY)");
        }
    }

    /**
     * حساب المسافة والوقت المتبقي بين نقطة انطلاق ومجموعة من الوجهات
     *
     * @param string|array $origin "lat,lng"
     * @param array $destinations ["lat,lng", "lat,lng"]
     * @return array|null
     */
    public function getDistanceAndETA($origin, array $destinations): ?array
    {
        if (!$this->client) {
            return null;
        }

        try {
            $results = $this->client->distanceMatrix($origin, $destinations);

            if ($results['status'] !== 'OK') {
                Log::error("Google Maps Distance Matrix Error: " . $results['status']);
                return null;
            }

            $data = [];
            foreach ($results['rows'][0]['elements'] as $index => $element) {
                if ($element['status'] === 'OK') {
                    $data[] = [
                        'destination' => $destinations[$index],
                        'distance_text' => $element['distance']['text'],
                        'distance_value' => $element['distance']['value'], // بالمتر
                        'duration_text' => $element['duration']['text'],
                        'duration_value' => $element['duration']['value'], // بالثانية
                    ];
                } else {
                    $data[] = [
                        'destination' => $destinations[$index],
                        'status' => $element['status'],
                    ];
                }
            }

            return $data;
        } catch (\Exception $e) {
            Log::error("Google Maps Service Exception: " . $e->getMessage());
            return null;
        }
    }
}
