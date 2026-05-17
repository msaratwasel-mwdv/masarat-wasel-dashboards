<?php
require 'vendor/autoload.php';
use Kreait\Firebase\Messaging\CloudMessage;

try {
    CloudMessage::withTarget('token', 'x')
        ->withAndroidConfig([
            'notification' => [
                'default_vibrate_timings' => true
            ]
        ]);
    echo "OK\n";
} catch (\Throwable $e) {
    echo get_class($e) . ': ' . $e->getMessage() . "\n";
}
