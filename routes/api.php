<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BusBoardingController;
use App\Http\Controllers\Api\BusLocationController;
use App\Http\Controllers\Api\GuardianNotificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| واجهات برمجة التطبيقات للتطبيقات المحمولة (Flutter)
|
*/

// ========== المصادقة ==========
Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ═══ Broadcasting Auth for Sanctum (API Tokens) ═══
Route::post('/broadcasting/auth', function (Request $request) {
    $user = $request->user();
    if (!$user) {
        return response()->json(['message' => 'Unauthenticated'], 401);
    }
    return \Illuminate\Support\Facades\Broadcast::auth($request);
})->middleware('auth:sanctum');

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

    // ========== الشات والمحادثات ==========
    // 1. عرض جهات الاتصال (لأولياء الأمور والمشرفات والسائقين)
    Route::get('/contacts', [\App\Http\Controllers\Api\ChatController::class, 'getContacts']);
    // 2. عرض المحادثات السابقة
    Route::get('/conversations', [\App\Http\Controllers\Api\ChatController::class, 'getConversations']);
    // 3. بدء أو استرجاع محادثة بناءً على ID المستخدم الآخر
    Route::post('/conversations', [\App\Http\Controllers\Api\ChatController::class, 'startConversation']);
    // 4. إرسال رسالة داخل محادثة معينة
    Route::post('/conversations/{conversation}/messages', [\App\Http\Controllers\Api\ChatController::class, 'sendMessage']);
    // 5. جلب رسائل المحادثة
    Route::get('/conversations/{conversation}/messages', [\App\Http\Controllers\Api\ChatController::class, 'getMessages']);
    // 6. تحديد المحادثة كمقروءة
    Route::post('/conversations/{conversation}/read', [\App\Http\Controllers\Api\ChatController::class, 'markAsRead']);
});
