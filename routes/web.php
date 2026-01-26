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

// الصفحة الرئيسية للمشروع
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
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

        // Drivers Routes
        Route::get('drivers', [StaffController::class, 'index'])->name('drivers.index');
        Route::post('drivers', [StaffController::class, 'storeDriver'])->name('drivers.store');
        Route::put('drivers/{driver}', [StaffController::class, 'updateDriver'])->name('drivers.update');
        Route::delete('drivers/{driver}', [StaffController::class, 'destroyDriver'])->name('drivers.destroy');

        // المشرفين
        Route::resource('supervisors', SupervisorController::class)->except(['create', 'edit', 'show']);

        // الحافلات - شامل جميع الوظائف
        Route::resource('buses', BusController::class);
        Route::post('buses/{bus}/assign', [BusController::class, 'assignToSchool'])->name('buses.assign');
        Route::post('buses/{bus}/archive', [BusController::class, 'archive'])->name('buses.archive');
        Route::delete('buses/documents/{document}', [BusController::class, 'deleteDocument'])->name('buses.documents.destroy');

        // طلبات الحافلات
        Route::get('bus-requests', [\App\Http\Controllers\Admin\BusRequestController::class, 'index'])->name('bus-requests.index');
        Route::post('bus-requests/{busRequest}/approve', [\App\Http\Controllers\Admin\BusRequestController::class, 'approve'])->name('bus-requests.approve');
        Route::post('bus-requests/{busRequest}/reject', [\App\Http\Controllers\Admin\BusRequestController::class, 'reject'])->name('bus-requests.reject');

        Route::get('assignmentHistory', [ReportController::class, 'assignmentHistory'])->name('assignmentHistory');
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

        // 3. إدارة المعلمين
        Route::resource('teachers', TeacherController::class)->except(['show']);

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
            Route::put('/{id}', [AttendanceController::class, 'update'])->name('attendance.update');
            Route::delete('/{id}', [AttendanceController::class, 'destroy'])->name('attendance.destroy');
            Route::post('/bulk', [AttendanceController::class, 'bulkStore'])->name('attendance.bulk');
        });

        // 6. الحافلات والرحلات
        Route::resource('buses', \App\Http\Controllers\School\BusController::class);
        Route::post('buses/bulk-destroy', [\App\Http\Controllers\School\BusController::class, 'bulkDestroy'])->name('buses.bulk-destroy');
        Route::get('buses/tracking/api', [\App\Http\Controllers\School\BusController::class, 'trackingApi'])->name('buses.tracking.api');

        // طلبات الحافلات (ما زالت موجودة كـ API/Controller لكن الواجهة موحدة)
        Route::post('bus-requests', [\App\Http\Controllers\School\BusRequestController::class, 'store'])->name('bus-requests.store');
        Route::put('bus-requests/{busRequest}', [\App\Http\Controllers\School\BusRequestController::class, 'update'])->name('bus-requests.update');
        Route::delete('bus-requests/{busRequest}', [\App\Http\Controllers\School\BusRequestController::class, 'destroy'])->name('bus-requests.destroy');

        // 7. الإشعارات
        Route::resource('notifications', \App\Http\Controllers\School\NotificationController::class);
        Route::post('notifications/preview', [\App\Http\Controllers\School\NotificationController::class, 'preview'])->name('notifications.preview');

        Route::resource('trip-schedules', \App\Http\Controllers\School\TripScheduleController::class);
        Route::post('trip-schedules/copy', [\App\Http\Controllers\School\TripScheduleController::class, 'copy'])->name('trip-schedules.copy');

        Route::resource('field-trips', \App\Http\Controllers\School\FieldTripController::class);
    });

// ⚪ ثالثاً: روابط الملف الشخصي والإشعارات
Route::middleware('auth')->group(function () {
    // Notifications
    Route::get('/notifications/all', [\App\Http\Controllers\NotificationController::class, 'page'])->name('notifications.page');
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('notifications.readAll');
    Route::delete('/notifications/{id}', [\App\Http\Controllers\NotificationController::class, 'destroy'])->name('notifications.destroy');
    Route::delete('/notifications', [\App\Http\Controllers\NotificationController::class, 'destroyAll'])->name('notifications.destroyAll');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
