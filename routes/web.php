<?php

use App\Http\Controllers\Admin\SchoolController;
use App\Http\Controllers\Admin\SchoolUserController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});


Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.') // هذا السطر يضيف "admin." لكل الأسماء أدناه
    ->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Admin/Dashboard');
    })->name('dashboard');
        // 👇 التصحيح: حذفنا "admin." من بداية الأسماء
        Route::get('/schools', [SchoolController::class, 'index'])->name('schools.index');
        Route::get('/schools/create', [SchoolController::class, 'create'])->name('schools.create');
        Route::post('/schools', [SchoolController::class, 'store'])->name('schools.store');

        // انتبه: الرابط القياسي لعرض التفاصيل يجب أن يكون هكذا
        Route::get('schools/{school}', [SchoolController::class, 'show'])->name('schools.show');
        Route::get('schools/{school}/edit', [SchoolController::class, 'edit'])->name('schools.edit');
        Route::put('schools/{school}', [SchoolController::class, 'update'])->name('schools.update');
        Route::delete('schools/{school}', [SchoolController::class, 'destroy'])->name('schools.destroy');

        Route::post('schools/{school}/toggle', [SchoolController::class, 'toggleStatus'])->name('schools.toggle');

        Route::get('schools/{school}/admins/create', [SchoolUserController::class, 'create'])->name('schools.users.create');
        Route::post('schools/{school}/admins', [SchoolUserController::class, 'store'])->name('schools.users.store');
    });
Route::middleware(['auth', 'verified', 'role:school_admin']) //
    ->prefix('school')
    ->name('school.')
    ->group(function () {
        Route::get('/dashboard', function () {
            return Inertia::render('School/Dashboard');
        })->name('dashboard');
    });

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
