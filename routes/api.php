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
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']); // تغيير كلمة السر
    Route::post('/auth/profile/update', [AuthController::class, 'updateProfile']);    // تحديث البيانات
    Route::post('/auth/profile/avatar', [AuthController::class, 'updateAvatar']);    // تحديث الصورة

    // --- ركوب/نزول الطلاب (للمشرف والسائق) ---
    Route::post('/bus/{bus}/board', [BusBoardingController::class, 'board']);
    Route::post('/bus/{bus}/alight', [BusBoardingController::class, 'alight']);
    Route::get('/bus/{bus}/passengers', [BusBoardingController::class, 'passengers']);
    Route::post('/bus/{bus}/start-trip', [BusBoardingController::class, 'startTrip']);
    Route::post('/bus/{bus}/end-trip', [BusBoardingController::class, 'endTrip']);

    // --- تحديث وجلب موقع الباص ---
    Route::post('/bus/{bus}/location', [BusLocationController::class, 'update']);
    Route::get('/bus/{bus}/location', [BusLocationController::class, 'show']);

    // --- إشعارات ولي الأمر ---
    Route::get('/guardian/notifications', [GuardianNotificationController::class, 'index']);
    Route::post('/guardian/notifications/{id}/read', [GuardianNotificationController::class, 'markAsRead']);

    // --- بيانات ولي الأمر ---
    Route::get('/parent/profile', [\App\Http\Controllers\Api\ParentController::class, 'profile']);
    Route::post('/parent/profile/update', [\App\Http\Controllers\Api\ParentController::class, 'updateProfile']);
    Route::post('/parent/profile/avatar', [\App\Http\Controllers\Api\ParentController::class, 'updateAvatar']);
    Route::get('/parent/children', [\App\Http\Controllers\Api\ParentController::class, 'children']);
    Route::get('/parent/children/{id}/attendance', [\App\Http\Controllers\Api\ParentController::class, 'childAttendance']);

    // --- طلبات الغياب ---
    Route::post('/parent/absence-requests', [\App\Http\Controllers\Api\ParentController::class, 'storeAbsenceRequest']);
    Route::get('/parent/absence-requests', [\App\Http\Controllers\Api\ParentController::class, 'absenceRequestsHistory']);

    // --- المشرف الميداني ---
    Route::get('/field/buses', [\App\Http\Controllers\Api\FieldSupervisorApiController::class, 'buses']);
    Route::get('/field/inspection-items', [\App\Http\Controllers\Api\FieldSupervisorApiController::class, 'inspectionItems']);
    Route::post('/field/inspections', [\App\Http\Controllers\Api\FieldSupervisorApiController::class, 'storeInspection']);
    Route::post('/field/violations', [\App\Http\Controllers\Api\FieldSupervisorApiController::class, 'storeViolation']);
    Route::post('/field/incidents', [\App\Http\Controllers\Api\FieldSupervisorApiController::class, 'storeIncident']);

    // ═══════════════════════════════════════════════════════════
    // Chat API Routes (Mobile App)
    // ═══════════════════════════════════════════════════════════
    Route::group(['prefix' => 'chat'], function () {
        // 1. جهات الاتصال
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

    // --- المشرف الميداني (Field Supervisor) ---
    Route::group(['prefix' => 'field'], function () {
        Route::get('/buses', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'getBuses']);
        Route::get('/inspection-items', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'getInspectionItems']);
        Route::post('/inspections', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'submitInspection']);
        Route::post('/incidents', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'reportIncident']);
        Route::post('/violations', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'submitViolation']);
    });
});
