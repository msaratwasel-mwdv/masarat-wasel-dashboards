<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\BusController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\SchoolController;
use App\Http\Controllers\Admin\SchoolUserController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\SupervisorController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\School\Attendance\AttendanceController;
use App\Http\Controllers\School\ClassroomController;
use App\Http\Controllers\School\StudentController;
use App\Http\Controllers\School\TeacherController;
use App\Models\AssignmentHistory;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => false,
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Subscription UI Page
Route::get('/subscription', function () {
    return Inertia::render('Subscription');
})->name('subscription');

// 🌱 رابط بذر البيانات التجريبية مباشرة من المتصفح (للتطوير فقط)
Route::get('/seed-test-data', function () {
    if (app()->environment('production')) {
        abort(403, 'Not allowed in production');
    }

    $school = \App\Models\School::first();
    if (!$school) {
        return "❌ لا توجد مدرسة في قاعدة البيانات. يرجى تشغيل migrate:fresh --seed أولاً.";
    }

    $results = [];

    // 1. Create Classroom if not exists
    $classroom = \App\Models\Classroom::firstOrCreate(
        ['school_id' => $school->id, 'name' => 'أول ابتدائي'],
        ['section' => 'أ', 'grade' => '1']
    );
    $results[] = "✅ الفصل: {$classroom->name} (ID: {$classroom->id})";

    // 2. Create Guardian user if not exists
    $parentUser = \App\Models\User::firstOrCreate(
        ['email' => 'parent@wasel.com'],
        [
            'name'        => 'ولي أمر تجريبي',
            'password'    => \Illuminate\Support\Facades\Hash::make('password'),
            'role'        => 'guardian',
            'user_code'   => 'GD-001',
            'phone'       => '966500000003',
            'national_id' => '1000200030',
            'school_id'   => $school->id,
            'fcm_token'   => null,
        ]
    );
    $results[] = "✅ مستخدم ولي الأمر: {$parentUser->email} (ID: {$parentUser->id})";

    // 3. Create Guardian record if not exists (Commented out because Guardian model does not exist)
    /*
    $guardian = \App\Models\Guardian::firstOrCreate(
        ['national_id' => '1000200030'],
        [
            'user_id'   => $parentUser->id,
            'school_id' => $school->id,
            'name'      => 'ولي أمر تجريبي',
            'name_en'   => 'Test Guardian',
            'phone'     => '0555555555',
            'email'     => 'parent@wasel.com',
        ]
    );
    $results[] = "✅ ولي الأمر: {$guardian->name} (ID: {$guardian->id})";

    // Link guardian to user
    if (!$parentUser->guardian) {
        $parentUser->update(['school_id' => $school->id]);
    }
    */

    // 4. Create Student if not exists
    $student = \App\Models\Student::firstOrCreate(
        ['national_id' => '9998887770'],
        [
            'full_name'    => 'طالب تجريبي',
            'student_code' => 'ST-001',
            'gender'       => 'male',
            'guardian_id'  => $parentUser->id, // Fallback to parentUser.id
            'school_id'    => $school->id,
            'is_active'    => true,
        ]
    );
    $results[] = "✅ الطالب: {$student->full_name} (ID: {$student->id})";

    // 5. Enrollment
    $enrollment = \App\Models\StudentSchoolEnrollment::firstOrCreate(
        ['student_id' => $student->id, 'school_id' => $school->id],
        ['classroom_id' => $classroom->id, 'status' => 'active', 'is_active' => true]
    );
    $results[] = "✅ التسجيل في الفصل: تم";

    $resultHtml = implode('<br>', $results);
    return "
        <html><body style='font-family: Arial; padding: 30px; direction: rtl;'>
        <h2>🌱 نتائج بذر البيانات التجريبية</h2>
        <p>{$resultHtml}</p>
        <hr>
        <h3>📱 بيانات تسجيل الدخول في Flutter:</h3>
        <p>الرقم الوطني: <strong>1000200030</strong></p>
        <p>رقم الجوال: <strong>0555555555</strong></p>
        <hr>
        <a href='/boarding-test' style='background:#4CAF50;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;'>
            🚀 اختبار إشعار الحافلة
        </a>
        &nbsp;
        <a href='/school/notifications' style='background:#2196F3;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;'>
            📬 إرسال إشعار من اللوحة
        </a>
        </body></html>
    ";
});

// 🧪 رابط تجريبي لاختبار إشعارات ركوب الحافلة من المتصفح مباشرة
Route::get('/boarding-test', function () {
    $student = \App\Models\Student::with('guardian.user')->first();
    $bus = \App\Models\Bus::first();

    if (!$student || !$bus || !$student->guardian || !$student->guardian->user) {
        return "❌ خطأ: البيانات غير كافية في قاعدة البيانات. يرجى تشغيل seeder أولاً.";
    }

    return "
        <div style='font-family: sans-serif; text-align: center; margin-top: 50px;'>
            <h2>اختبار إشعار ركوب الحافلة 🚌</h2>
            <p><strong>الطالب:</strong> {$student->full_name}</p>
            <p><strong>ولي الأمر:</strong> {$student->guardian->user->name}</p>
            <p><strong>الجهاز المستهدف (FCM Token):</strong> " . substr($student->guardian->user->fcm_token, 0, 20) . "...</p>

            <form action='/boarding-test/trigger' method='POST'>
                <input type='hidden' name='_token' value='" . csrf_token() . "'>
                <button type='submit' style='background: #4CAF50; color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 18px;'>
                    🚀 تسجيل ركوب الطالب (إرسال إشعار)
                </button>
            </form>
        </div>
    ";
});

Route::post('/boarding-test/trigger', function () {
    $student = \App\Models\Student::first();
    $bus = \App\Models\Bus::first();

    if (!$student || !$bus) {
        return "❌ خطأ في البيانات.";
    }

    $service = app(\App\Services\NotificationService::class);
    $service->notifyStudentGuardian(
        $student->id,
        'bus_boarding_morning',
        '🚌 ركب الحافلة بأمان',
        $student->full_name . " ركب حافلة رقم " . $bus->bus_number . " متوجهاً إلى المدرسة.",
        ['notification_type' => 'bus_boarding_morning', 'student_id' => $student->id]
    );

    return "<div style='font-family: sans-serif; text-align: center; margin-top: 50px;'>
                <h2 style='color: green;'>✅ تم إرسال طلب الإشعار بنجاح!</h2>
                <p>يمكنك الآن فحص <code>laravel.log</code> للتأكد.</p>
                <a href='/boarding-test'>العودة</a>
            </div>";
});

// 🟢 أولاً: روابط مدير الشركة (Admin)
Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        // المدارس
        Route::get('/schools', [SchoolController::class, 'index'])->name('schools.index');
        Route::get('/schools/create', [SchoolController::class, 'create'])->name('schools.create');
        Route::post('/schools', [SchoolController::class, 'store'])->name('schools.store');
        Route::get('schools/{school}', [SchoolController::class, 'show'])->name('schools.show');
        Route::get('schools/{school}/edit', [SchoolController::class, 'edit'])->name('schools.edit');
        Route::put('schools/{school}', [SchoolController::class, 'update'])->name('schools.update');
        Route::delete('schools/{school}', [SchoolController::class, 'destroy'])->name('schools.destroy');
        Route::post('schools/{school}/toggle', [SchoolController::class, 'toggleStatus'])->name('schools.toggle');
        Route::get('schools/{school}/admins/create', [SchoolUserController::class, 'create'])->name('schools.users.create');
        Route::post('schools/{school}/admins', [SchoolUserController::class, 'store'])->name('schools.users.store');
        Route::get('schools/{school}/admins/{user}/edit', [SchoolUserController::class, 'edit'])->name('schools.users.edit');
        Route::put('schools/{school}/admins/{user}', [SchoolUserController::class, 'update'])->name('schools.users.update');
        Route::delete('schools/{school}/admins/{user}', [SchoolUserController::class, 'destroy'])->name('schools.users.destroy');

        // المسارات
        Route::resource('routes', \App\Http\Controllers\Admin\RouteController::class);

        // Drivers Routes
        Route::get('drivers', [StaffController::class, 'index'])->name('drivers.index');
        Route::post('drivers', [StaffController::class, 'storeDriver'])->name('drivers.store');
        Route::put('drivers/{driver}', [StaffController::class, 'updateDriver'])->name('drivers.update');
        Route::delete('drivers/{driver}', [StaffController::class, 'destroyDriver'])->name('drivers.destroy');

        // المشرفين
        Route::resource('supervisors', SupervisorController::class)->except(['create', 'edit', 'show']);

        // المشرفين الميدانيين
        Route::resource('field-supervisors', \App\Http\Controllers\Admin\FieldSupervisorController::class)
            ->parameters(['field-supervisors' => 'field_supervisor'])
            ->except(['create', 'edit', 'show']);

        // الحافلات - شامل جميع الوظائف
        Route::resource('buses', BusController::class);
        Route::post('buses/{bus}/assign', [BusController::class, 'assignToSchool'])->name('buses.assign');
        Route::post('buses/{bus}/assign-route', [BusController::class, 'assignRoute'])->name('buses.assign-route');
        Route::post('buses/{bus}/archive', [BusController::class, 'archive'])->name('buses.archive');
        Route::post('buses/{bus}/restore', [BusController::class, 'restore'])->name('buses.restore');
        Route::delete('buses/documents/{document}', [BusController::class, 'deleteDocument'])->name('buses.documents.destroy');

        // طلبات الحافلات
        Route::get('bus-requests', [\App\Http\Controllers\Admin\BusRequestController::class, 'index'])->name('bus-requests.index');
        Route::post('bus-requests/{busRequest}/approve', [\App\Http\Controllers\Admin\BusRequestController::class, 'approve'])->name('bus-requests.approve');
        Route::post('bus-requests/{busRequest}/reject', [\App\Http\Controllers\Admin\BusRequestController::class, 'reject'])->name('bus-requests.reject');

        Route::get('assignmentHistory', [ReportController::class, 'assignmentHistory'])->name('assignmentHistory');
        Route::get('field-reports', [\App\Http\Controllers\Admin\FieldReportController::class, 'index'])->name('field-reports.index');
        Route::resource('inspection-items', \App\Http\Controllers\Admin\InspectionItemController::class)->except(['create', 'show', 'edit']);
        Route::get('emergencies', [\App\Http\Controllers\Admin\EmergencyController::class, 'index'])->name('emergencies.index');
        Route::put('emergencies/{incident}/status', [\App\Http\Controllers\Admin\EmergencyController::class, 'updateStatus'])->name('emergencies.update-status');
        Route::get('inspection-logs', [\App\Http\Controllers\Admin\InspectionLogController::class, 'index'])->name('inspection-logs.index');

        // مراقبة المحادثات
        Route::get('chat', [\App\Http\Controllers\Admin\ChatMonitorController::class, 'index'])->name('chat.index');
        Route::get('chat/{conversation}', [\App\Http\Controllers\Admin\ChatMonitorController::class, 'show'])->name('chat.show');
        Route::delete('chat/messages/{message}', [\App\Http\Controllers\Admin\ChatMonitorController::class, 'deleteMessage'])->name('chat.messages.destroy');
        Route::post('chat/alert/{user}', [\App\Http\Controllers\Admin\ChatMonitorController::class, 'alertUser'])->name('chat.alert');

        // أزرار لوحة التحكم
        Route::post('system/execute', [\App\Http\Controllers\Admin\SystemCommandController::class, 'execute'])->name('system.execute');

        // الرحلات الميدانية (Admin)
        Route::resource('field-trips', \App\Http\Controllers\Admin\FieldTripController::class)->except(['create', 'store', 'edit', 'destroy']);
        Route::post('field-trips/{field_trip}/approve', [\App\Http\Controllers\Admin\FieldTripController::class, 'approve'])->name('field-trips.approve');
        Route::post('field-trips/{field_trip}/reject', [\App\Http\Controllers\Admin\FieldTripController::class, 'reject'])->name('field-trips.reject');

        // الرحلات اليومية (Daily Trips)
        Route::resource('daily-trips', \App\Http\Controllers\Admin\DailyTripController::class);
        Route::post('daily-trips/auto-create', [\App\Http\Controllers\Admin\DailyTripController::class, 'autoCreate'])->name('daily-trips.auto-create');

        // Alias for notifications to fix frontend desyncs
        Route::prefix('notifications')->group(function () {
            Route::get('/all', [\App\Http\Controllers\NotificationController::class, 'page']);
            Route::get('/', [\App\Http\Controllers\NotificationController::class, 'index']);
            Route::post('/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
            Route::post('/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
            Route::delete('/{id}', [\App\Http\Controllers\NotificationController::class, 'destroy']);
            Route::delete('/', [\App\Http\Controllers\NotificationController::class, 'destroyAll']);
        });

    });


// 🔵 ثانياً: روابط مدير المدرسة (School Admin)
Route::middleware(['auth', 'verified', 'role:school_admin'])
    ->prefix('school')
    ->name('school.')
    ->group(function () {
        // 1. لوحة التحكم
        Route::get('/dashboard', [\App\Http\Controllers\School\DashboardController::class, 'index'])->name('dashboard');

        // 2. إدارة الفصول
        Route::get('classes-api', [ClassroomController::class, 'apiIndex'])->name('classrooms.api');
        Route::resource('classrooms', ClassroomController::class);

        // 3. إدارة المعلمين والمشرفين
        Route::resource('teachers', TeacherController::class);
        Route::resource('supervisors', \App\Http\Controllers\School\SupervisorController::class)->except(['show']);

        // 4. إدارة الطلاب
        Route::get('students-api', [StudentController::class, 'apiIndex'])->name('students.api');
        Route::resource('students', StudentController::class);
        Route::post('students/{student}/update', [StudentController::class, 'update'])->name('students.update_post');

        Route::post('guardians/search', [StudentController::class, 'searchGuardian'])->name('guardians.search');
        Route::post('guardians', [StudentController::class, 'storeGuardian'])->name('guardians.store');

        // 5. الحضور
        Route::get('students/{student}/attendance', [StudentController::class, 'attendanceHistory'])->name('students.attendance');
        Route::get('/reports/attendance', function () {
            return Inertia::render('School/Attendance/AttendanceReports');
        })->name('reports.attendance');
        // 5. الحضور
        Route::get('students/{student}/attendance', [StudentController::class, 'attendanceHistory'])->name('students.attendance');
        Route::get('/reports/attendance', function () {
            return Inertia::render('School/Attendance/AttendanceReports');
        })->name('reports.attendance');

        Route::prefix('attendance')->group(function () {
            Route::get('/', [AttendanceController::class, 'index'])->name('attendance.index');
            Route::post('/', [AttendanceController::class, 'store'])->name('attendance.store');
            Route::get('/{id}', [AttendanceController::class, 'show'])->name('attendance.show');
            Route::delete('/{id}', [AttendanceController::class, 'destroy'])->name('attendance.destroy');
            Route::post('/bulk', [AttendanceController::class, 'bulkStore'])->name('attendance.bulk');
        });

        // 5.5 طلبات الغياب
        Route::get('absence-requests', [\App\Http\Controllers\School\AbsenceRequestController::class, 'index'])->name('absence-requests.index');
        Route::post('absence-requests/{absenceRequest}/process', [\App\Http\Controllers\School\AbsenceRequestController::class, 'process'])->name('absence-requests.process');

        // 6. الحافلات والرحلات
        Route::resource('buses', \App\Http\Controllers\School\BusController::class);
        Route::post('buses/bulk-destroy', [\App\Http\Controllers\School\BusController::class, 'bulkDestroy'])->name('buses.bulk-destroy');
        Route::resource('bus-groups', \App\Http\Controllers\School\BusGroupController::class);
        Route::get('buses/tracking/api', [\App\Http\Controllers\School\BusController::class, 'trackingApi'])->name('buses.tracking.api');
        Route::get('live-tracking', [\App\Http\Controllers\School\BusController::class, 'liveTracking'])->name('live-tracking.index');
        Route::get('bus-assignments', [\App\Http\Controllers\School\BusController::class, 'assignStudentsPage'])->name('buses.students.assign');
        Route::post('bus-assignments', [\App\Http\Controllers\School\BusController::class, 'saveAssignedStudents'])->name('buses.students.save');

        // طلبات الحافلات (ما زالت موجودة كـ API/Controller لكن الواجهة موحدة)
        Route::post('bus-requests', [\App\Http\Controllers\School\BusRequestController::class, 'store'])->name('bus-requests.store');
        Route::put('bus-requests/{busRequest}', [\App\Http\Controllers\School\BusRequestController::class, 'update'])->name('bus-requests.update');
        Route::delete('bus-requests/{busRequest}', [\App\Http\Controllers\School\BusRequestController::class, 'destroy'])->name('bus-requests.destroy');

        // 7. الإشعارات
        Route::resource('notifications', \App\Http\Controllers\School\NotificationController::class);
        Route::post('notifications/preview', [\App\Http\Controllers\School\NotificationController::class, 'preview'])->name('notifications.preview');

        Route::resource('trip-schedules', \App\Http\Controllers\School\TripScheduleController::class);
        Route::post('trip-schedules/copy', [\App\Http\Controllers\School\TripScheduleController::class, 'copy'])->name('trip-schedules.copy');

        Route::resource('routes', \App\Http\Controllers\School\RouteController::class);
        Route::resource('field-trips', \App\Http\Controllers\School\FieldTripController::class);

        // Trips Dashboard
        Route::get('trips-dashboard', [\App\Http\Controllers\School\TripDashboardController::class, 'index'])->name('trips.dashboard');
        Route::get('trips/{trip}', [\App\Http\Controllers\School\TripDashboardController::class, 'show'])->name('trips.show');

        // Trip Reports
        Route::get('trip-reports', [\App\Http\Controllers\School\TripReportController::class, 'index'])->name('trip-reports.index');
        Route::get('trip-reports/data', [\App\Http\Controllers\School\TripReportController::class, 'getData'])->name('trip-reports.data');
    });

// ⚪ ثالثاً: روابط الملف الشخصي
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // الإشعارات العامة (لجميع المستخدمين المسجلين)
    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/all', [\App\Http\Controllers\NotificationController::class, 'page'])->name('page');
        Route::get('/', [\App\Http\Controllers\NotificationController::class, 'index'])->name('index');
        Route::post('/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('read');
        Route::post('/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('readAll');
        Route::delete('/{id}', [\App\Http\Controllers\NotificationController::class, 'destroy'])->name('destroy');
        Route::delete('/', [\App\Http\Controllers\NotificationController::class, 'destroyAll'])->name('destroyAll');
    });
});

require __DIR__ . '/auth.php';
