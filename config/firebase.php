<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Firebase Configuration
    |--------------------------------------------------------------------------
    */

    'default' => env('FIREBASE_PROJECT', 'app'),

    'projects' => [
        env('FIREBASE_PROJECT', 'app') => [
            'credentials' => env('FIREBASE_CREDENTIALS', storage_path('app/firebase/service-account.json')),
        ],
        'parent' => [ // Fallback in case env variable is explicitly "parent"
            'credentials' => env('FIREBASE_CREDENTIALS', storage_path('app/firebase/service-account.json')),
        ],
        'app' => [
            'credentials' => env('FIREBASE_CREDENTIALS', storage_path('app/firebase/service-account.json')),
        ],
    ],
];
