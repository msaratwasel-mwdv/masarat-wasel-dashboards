<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ═══ Broadcasting Auth for Sanctum (API Tokens) ═══
Route::post('/broadcasting/auth', function (Request $request) {
    $user = $request->user();
    if (!$user) {
        return response()->json(['message' => 'Unauthenticated'], 401);
    }
    // Use Broadcast::auth to authenticate the channel
    return \Illuminate\Support\Facades\Broadcast::auth($request);
})->middleware('auth:sanctum');

// ═══════════════════════════════════════════════════════════
// Chat API Routes (Mobile / Simulator)
// ═══════════════════════════════════════════════════════════
Route::middleware('auth:sanctum')->prefix('chat')->group(function () {
    // 1. جهات الاتصال
    Route::get('/contacts', [\App\Http\Controllers\Api\ChatController::class, 'getContacts']);

    // 2. المحادثات (قائمة)
    Route::get('/conversations', [\App\Http\Controllers\Api\ChatController::class, 'getConversations']);

    // 3. بدء محادثة جديدة / إرسال أول رسالة
    Route::post('/conversations', [\App\Http\Controllers\Api\ChatController::class, 'startConversation']);

    // 4. رسائل محادثة معينة
    Route::get('/conversations/{conversation}/messages', [\App\Http\Controllers\Api\ChatController::class, 'getMessages']);

    // 5. إرسال رسالة في محادثة
    Route::post('/conversations/{conversation}/messages', [\App\Http\Controllers\Api\ChatController::class, 'sendMessage']);

    // 6. تحديد المحادثة كمقروءة
    Route::post('/conversations/{conversation}/read', [\App\Http\Controllers\Api\ChatController::class, 'markAsRead']);
});
