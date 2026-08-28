<?php

namespace Tests\Unit\Services;

use App\Services\GoogleMapsService;
use Tests\TestCase;

class GoogleMapsServiceTest extends TestCase
{
    public function test_google_maps_returns_null_when_api_key_is_missing(): void
    {
        config(['services.google_maps.key' => null]);

        $service = new GoogleMapsService;

        $result = $service->getDistanceAndETA('24.7136,46.6753', ['24.7743,46.7386']);

        $this->assertNull($result);
    }
}
