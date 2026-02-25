<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BusBoardingController;
use App\Http\Controllers\Api\BusLocationController;
use App\Http\Controllers\Api\GuardianNotificationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| واجهات برمجة التطبيقات للتطبيقات المحمولة (Flutter)
|
*/

// ========== المصادقة (بدون حماية) ==========
Route::post('/auth/login', [AuthController::class, 'login']);

// ========== الروابط المحمية بـ Sanctum ==========
Route::middleware('auth:sanctum')->group(function () {

    // --- المصادقة ---
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/fcm-token', [AuthController::class, 'registerFcmToken']); // Firebase FCM Token

    // --- ركوب/نزول الطلاب (للمشرف والسائق) ---
    Route::post('/bus/{bus}/board', [BusBoardingController::class, 'board']);
    Route::post('/bus/{bus}/alight', [BusBoardingController::class, 'alight']);
    Route::get('/bus/{bus}/passengers', [BusBoardingController::class, 'passengers']);

    // --- تحديث موقع الباص (للسائق) ---
    Route::post('/bus/{bus}/location', [BusLocationController::class, 'update']);

    // --- إشعارات ولي الأمر ---
    Route::get('/guardian/notifications', [GuardianNotificationController::class, 'index']);
    Route::post('/guardian/notifications/{id}/read', [GuardianNotificationController::class, 'markAsRead']);
});
