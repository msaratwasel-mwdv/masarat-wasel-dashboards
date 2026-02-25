<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Firebase Configuration
    |--------------------------------------------------------------------------
    |
    | إعدادات Firebase لإرسال Push Notifications عبر FCM HTTP v1 API.
    | احصل على هذه القيم من Firebase Console → Project Settings → Service Accounts.
    |
    */

    // معرّف مشروع Firebase (Project ID)
    'project_id' => env('FIREBASE_PROJECT_ID', ''),

    // المسار المطلق لملف Service Account JSON
    'credentials' => env('FIREBASE_CREDENTIALS', storage_path('app/firebase/service-account.json')),
];
