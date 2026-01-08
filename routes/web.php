<?php

use App\Http\Controllers\Admin\SchoolController;
use App\Http\Controllers\Admin\SchoolUserController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\SupervisorController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\School\Attendance\AttendanceController;
use App\Http\Controllers\School\ClassroomController;
use App\Http\Controllers\School\StudentController;
use App\Http\Controllers\School\TeacherController;
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

// 🟢 أولاً: روابط مدير الشركة (Admin) - (مكتملة كما أرسلتها)
Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', function () {
            return Inertia::render('Admin/Dashboard');
        })->name('dashboard');

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

    // Drivers Routes
   Route::get('drivers', [StaffController::class, 'index'])->name('drivers.index');
    Route::post('drivers', [StaffController::class, 'storeDriver'])->name('drivers.store');
    Route::put('drivers/{driver}', [StaffController::class, 'updateDriver'])->name('drivers.update'); // للتعديل
    Route::delete('drivers/{driver}', [StaffController::class, 'destroyDriver'])->name('drivers.destroy'); // لل
    Route::resource('supervisors', SupervisorController::class)->except(['create', 'edit', 'show']);
    });

// 🔵 ثانياً: روابط مدير المدرسة (School Admin) - (تم الإصلاح والمعالجة الجراحية)
Route::middleware(['auth', 'verified', 'role:school_admin'])
    ->prefix('school')
    ->name('school.')
    ->group(function () {
        // 1. لوحة التحكم
        Route::get('/dashboard', [\App\Http\Controllers\School\DashboardController::class, 'index'])->name('dashboard');

        // 2. إدارة الفصول وربط المعلمين
        Route::get('classes-api', [ClassroomController::class, 'apiIndex'])->name('classrooms.api'); // Add this line
        Route::resource('classrooms', ClassroomController::class);

        // 3. إدارة المعلمين (إنشاء/عرض) ثم ربطهم بالفصول من شاشة تعديل الفصل
        // 3. إدارة المعلمين (إنشاء/عرض/تعديل/حذف)
        Route::resource('teachers', TeacherController::class)->except(['show']);

        // 4. إدارة الطلاب
        Route::get('students-api', [StudentController::class, 'apiIndex'])->name('students.api');
        Route::resource('students', StudentController::class);
        Route::post('students/{student}/update', [StudentController::class, 'update'])->name('students.update_post');

        Route::post('guardians/search', [StudentController::class, 'searchGuardian'])->name('guardians.search');
        Route::post('guardians', [StudentController::class, 'storeGuardian'])->name('guardians.store');

        // سجل حضور الطالب
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
    });

// ⚪ ثالثاً: روابط الملف الشخصي (Profile)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// ملف روابط المصادقة الافتراضي
require __DIR__.'/auth.php';
