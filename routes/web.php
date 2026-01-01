<?php

use App\Http\Controllers\Admin\SchoolController;
use App\Http\Controllers\Admin\SchoolUserController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\School\AttendanceController;
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
    });

// 🔵 ثانياً: روابط مدير المدرسة (School Admin) - (تم الإصلاح والمعالجة الجراحية)
Route::middleware(['auth', 'verified', 'role:school_admin'])
    ->prefix('school')
    ->name('school.')
    ->group(function () {
        // 1. لوحة التحكم
        Route::get('/dashboard', function () {
            return Inertia::render('School/Dashboard');
        })->name('dashboard');

        // 2. إدارة الفصول وربط المعلمين
        Route::resource('classrooms', ClassroomController::class);

        // 3. إدارة المعلمين (إنشاء/عرض) ثم ربطهم بالفصول من شاشة تعديل الفصل
        Route::get('teachers', [TeacherController::class, 'index'])->name('teachers.index');
        Route::post('teachers', [TeacherController::class, 'store'])->name('teachers.store');

        // 4. إدارة الطلاب
        Route::resource('students', StudentController::class);

        // التحقق من ولي الأمر (خطوة 1)
        Route::post('guardians/search', [StudentController::class, 'searchGuardian'])->name('guardians.search');
        Route::post('guardians', [StudentController::class, 'storeGuardian'])->name('guardians.store');

        // سجل حضور الطالب
        Route::get('students/{student}/attendance', [StudentController::class, 'attendanceHistory'])->name('students.attendance');

        // 5. الحضور اليومي
        Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::post('attendance', [AttendanceController::class, 'store'])->name('attendance.store');
    });

// ⚪ ثالثاً: روابط الملف الشخصي (Profile)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// ملف روابط المصادقة الافتراضي
require __DIR__.'/auth.php';
