<?php

namespace App\Helpers;

class BroadcastHelper
{
    /**
     * Check if Reverb server is running and reachable on port 8080.
     * Uses a fast 30ms non-blocking socket check to prevent single-threaded PHP freezing.
     */
    public static function isReverbRunning(): bool
    {
        static $available = null;
        if ($available !== null) {
            return $available;
        }

        $port = (int) env('REVERB_PORT', 8080);
        $host = env('REVERB_HOST', '127.0.0.1');
        if ($host === 'localhost') {
            $host = '127.0.0.1';
        }

        $fp = @fsockopen($host, $port, $errno, $errstr, 0.03);
        if ($fp) {
            fclose($fp);
            $available = true;
        } else {
            $available = false;
        }

        return $available;
    }

    /**
     * Safely broadcast an event only if Reverb/WebSockets is available.
     * Prevents blocking cURL timeouts on local development servers.
     */
    public static function safeBroadcast(mixed $event): void
    {
        if (self::isReverbRunning()) {
            try {
                broadcast($event);
            } catch (\Throwable $e) {
                \Log::warning('Broadcast failed safely: '.$e->getMessage());
            }
        }
    }
}
