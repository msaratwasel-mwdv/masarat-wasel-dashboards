<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DailyTripApiController;
use App\Http\Controllers\Api\BusLocationController;
use App\Http\Controllers\Api\GuardianNotificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| واجهات برمجة التطبيقات للتطبيقات المحمولة (Flutter)
|
*/

// ✅ Rate Limiting: 5 محاولات دخول فقط كل دقيقة — يمنع Brute Force attacks
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ═══ Broadcasting Auth for Sanctum (API Tokens) ═══
Route::post('/broadcasting/auth', function (Request $request) {
    try {
        $user = $request->user();
        \Log::info("Broadcasting auth attempt", [
            'user_id' => $user ? $user->id : 'guest',
            'channel' => $request->channel_name,
            'socket_id' => $request->socket_id
        ]);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        return \Illuminate\Support\Facades\Broadcast::auth($request);
    } catch (\Throwable $e) {
        \Log::error("Broadcasting auth API route error: " . $e->getMessage(), [
            'exception' => $e->getTraceAsString()
        ]);
        return response()->json(['message' => 'Broadcasting auth failed'], 500);
    }
})->middleware('auth:sanctum');

// ========== الروابط المحمية بـ Sanctum ==========
// ✅ Rate Limiting: 60 طلب كل دقيقة لكل المستخدمين المسجلين — يمنع DDoS
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {

    // --- المصادقة ---
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/fcm-token', [AuthController::class, 'registerFcmToken']); // Firebase FCM Token
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']); // تغيير كلمة السر
    Route::post('/auth/profile/update', [AuthController::class, 'updateProfile']);    // تحديث البيانات
    Route::post('/auth/profile/avatar', [AuthController::class, 'updateAvatar']);    // تحديث الصورة
    Route::post('/auth/profile/language', [AuthController::class, 'updateLanguage']); // تحديث اللغة المفضلة

    Route::middleware([\App\Http\Middleware\CheckTransportAccess::class])->group(function () {
        // --- ركوب/نزول الطلاب (للمشرف والسائق) ---
        Route::get('/driver/my-trips', [DailyTripApiController::class, 'myTrips']);
        Route::get('/driver/trips-history', [DailyTripApiController::class, 'tripsHistory']);
        Route::post('/bus/{bus}/mark-boarded', [DailyTripApiController::class, 'markBoarded']);

        Route::post('/bus/{bus}/group-board', [DailyTripApiController::class, 'groupBoard']);
        Route::post('/bus/{bus}/mark-dropped', [DailyTripApiController::class, 'markDropped']);
        Route::post('/bus/{bus}/group-alight', [DailyTripApiController::class, 'groupAlight']);
        Route::get('/bus/{bus}/passengers', [DailyTripApiController::class, 'passengers']);
        Route::post('/bus/{bus}/start-trip', [DailyTripApiController::class, 'startTrip']);
        Route::post('/bus/{bus}/confirm-trip', [DailyTripApiController::class, 'confirmTrip']);
        Route::post('/bus/{bus}/arrive', [DailyTripApiController::class, 'arrive']);
        // ✅ throttle:10,1 — أكثر تشدداً لأن الإشعارات قد تُستغل لـ spam
        Route::post('/bus/{bus}/notify-near-house', [DailyTripApiController::class, 'notifyNearHouse'])->middleware('throttle:10,1');
        Route::post('/bus/{bus}/mark-absent', [DailyTripApiController::class, 'markAbsent']);
        Route::post('/bus/{bus}/end-trip', [DailyTripApiController::class, 'endTrip']);
        Route::post('/driver/expenses', [\App\Http\Controllers\Api\Driver\BusExpenseApiController::class, 'store']);
        Route::get('/driver/expenses', [\App\Http\Controllers\Api\Driver\BusExpenseApiController::class, 'index']);

        // --- تحديث وجلب موقع الباص ---
        Route::post('/bus/{bus}/location', [BusLocationController::class, 'update']);
        Route::get('/bus/{bus}/location', [BusLocationController::class, 'show']);
        
        // --- المشرف الميداني ---
        Route::get('/field/buses', [\App\Http\Controllers\Api\FieldSupervisorApiController::class, 'buses']);
        Route::get('/field/inspection-items', [\App\Http\Controllers\Api\FieldSupervisorApiController::class, 'inspectionItems']);
        Route::post('/field/inspections', [\App\Http\Controllers\Api\FieldSupervisorApiController::class, 'storeInspection']);
        Route::post('/field/violations', [\App\Http\Controllers\Api\FieldSupervisorApiController::class, 'storeViolation']);
        Route::post('/field/incidents', [\App\Http\Controllers\Api\FieldSupervisorApiController::class, 'storeIncident']);
    });
    
    // --- إشعارات ولي الأمر ---
    Route::get('/guardian/notifications', [GuardianNotificationController::class, 'index']);
    Route::post('/guardian/notifications/{id}/read', [GuardianNotificationController::class, 'markAsRead']);

    // --- بيانات ولي الأمر ---
    Route::get('/parent/profile', [\App\Http\Controllers\Api\ParentController::class, 'profile']);
    Route::post('/parent/profile/update', [\App\Http\Controllers\Api\ParentController::class, 'updateProfile']);
    Route::post('/parent/profile/avatar', [\App\Http\Controllers\Api\ParentController::class, 'updateAvatar']);
    Route::get('/parent/children', [\App\Http\Controllers\Api\ParentController::class, 'children']);
    Route::get('/parent/children/{id}/attendance', [\App\Http\Controllers\Api\ParentController::class, 'childAttendance']);
    Route::post('/parent/location/update', [\App\Http\Controllers\Api\ParentController::class, 'updateLocation']);
    Route::post('/parent/student/location/update', [\App\Http\Controllers\Api\ParentController::class, 'updateStudentLocation']);

    // --- طلبات الغياب ---
    Route::post('/parent/absence-requests', [\App\Http\Controllers\Api\ParentController::class, 'storeAbsenceRequest']);
    Route::get('/parent/absence-requests', [\App\Http\Controllers\Api\ParentController::class, 'absenceRequestsHistory']);
    Route::get('/parent/location-requests', [\App\Http\Controllers\Api\ParentController::class, 'locationRequestsHistory']);

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
    Route::group(['prefix' => 'field', 'middleware' => [\App\Http\Middleware\CheckTransportAccess::class]], function () {
        Route::get('/dashboard-stats', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'getDashboardStats']);
        Route::get('/staff', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'getStaff']);
        Route::get('/buses', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'getBuses']);
        Route::get('/inspection-items', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'getInspectionItems']);
        Route::post('/inspections', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'submitInspection']);
        Route::get('/inspections', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'getInspections']);
        Route::post('/incidents', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'reportIncident']);
        Route::get('/incidents', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'getIncidents']);
        Route::post('/violations', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'submitViolation']);
        Route::get('/field-trips', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'getFieldTrips']);
        Route::get('/report', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'getDashboardReport']);
        Route::get('/delays', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'getDelays']);
        Route::post('/delays', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'storeDelay']);
        Route::get('/students', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'getStudentsList']);
        Route::post('/reassign-staff', [\App\Http\Controllers\Api\FieldSupervisorController::class, 'reassignStaff']);
    });

    // --- المعلم (Teacher) ---
    // تطبق ميدلوير التحقق من الاشتراك في الحضور على واجهات المعلم
    Route::group(['prefix' => 'teacher', 'middleware' => [\App\Http\Middleware\CheckAttendanceSubscription::class]], function () {
        Route::get('/classes', [\App\Http\Controllers\Api\TeacherController::class, 'getClasses']);
        Route::get('/classes/{classId}/students', [\App\Http\Controllers\Api\TeacherController::class, 'getStudents']);
        Route::put('/students/{studentId}/attendance', [\App\Http\Controllers\Api\TeacherController::class, 'markAttendance']);
        Route::get('/classes/{classId}/attendance-history', [\App\Http\Controllers\Api\TeacherController::class, 'getClassAttendanceHistory']);
        Route::get('/attendance-history', [\App\Http\Controllers\Api\TeacherController::class, 'getTeacherAttendanceHistory']);
        Route::get('/reports/stats', [\App\Http\Controllers\Api\TeacherController::class, 'getAttendanceStats']);
    });

    // ═══════════════════════════════════════════════════════════
    // Subscriptions, Plans, and Invoices
    // ═══════════════════════════════════════════════════════════
    Route::apiResource('plans', \App\Http\Controllers\Api\PlanController::class);
    
    Route::get('/subscriptions/my', [\App\Http\Controllers\Api\SubscriptionController::class, 'mySubscriptions']);
    Route::post('/subscriptions/attendance', [\App\Http\Controllers\Api\SubscriptionController::class, 'subscribeAttendance']);
    Route::post('/subscriptions/transport', [\App\Http\Controllers\Api\SubscriptionController::class, 'subscribeTransport']);

    Route::get('/invoices/my', [\App\Http\Controllers\Api\InvoiceController::class, 'myInvoices']);
    Route::get('/invoices/all', [\App\Http\Controllers\Api\InvoiceController::class, 'allInvoices']);
    Route::post('/invoices/{invoice}/payment', [\App\Http\Controllers\Api\InvoiceController::class, 'logPayment']);
});
