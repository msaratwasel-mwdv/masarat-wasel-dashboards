<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // ── Google Maps ───────────────────────────────────────────────
    'google_maps' => [
        'key' => env('Maps_API_KEY'), // Server-side key (backend only)
    ],
    'meta_whatsapp' => [
        'token' => env('META_WHATSAPP_TOKEN'),
        'phone_number_id' => env('META_PHONE_NUMBER_ID'),
        'english_code' => env('META_WHATSAPP_ENGLISH_CODE', 'en'),
        'templates' => [
            'student_status_ar' => env('WHATSAPP_TPL_STUDENT_STATUS_AR', 'student_bus_status'),
            'student_status_en' => env('WHATSAPP_TPL_STUDENT_STATUS_EN', 'student_bus_status_en'),
            'trip_summary_ar' => env('WHATSAPP_TPL_TRIP_SUMMARY_AR', 'bus_trip_summary'),
            'trip_summary_en' => env('WHATSAPP_TPL_TRIP_SUMMARY_EN', 'bus_trip_summary_en'),
        ],
    ],
];
