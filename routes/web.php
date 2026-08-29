<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AssistantController;
use App\Http\Controllers\Admin\BusController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\SchoolController;
use App\Http\Controllers\Admin\SchoolUserController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\SubscriptionController;
use App\Http\Controllers\Admin\TransactionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\School\Attendance\AttendanceController;
use App\Http\Controllers\School\ClassroomController;
use App\Http\Controllers\School\StudentController;
use App\Http\Controllers\School\TeacherController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $latestEvents = \App\Models\Event::where('is_published', true)
        ->orderBy('event_date', 'desc')
        ->take(3)
        ->get();

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => false,
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
        'latestEvents' => $latestEvents,
    ]);
});

// Subscription UI Page
Route::get('/subscription', [\App\Http\Controllers\SubscriptionPageController::class, 'index'])->name('subscription');
Route::post('/subscription', [\App\Http\Controllers\SubscriptionPageController::class, 'store'])->name('subscription.store');

// Public Events Page
Route::get('/events', [\App\Http\Controllers\PublicEventController::class, 'index'])->name('events.index');

// Dynamic XML Sitemap for SEO
Route::get('/sitemap.xml', function () {
    $events = \App\Models\Event::where('is_published', true)->orderBy('updated_at', 'desc')->get();

    $xml = '<?xml version="1.0" encoding="UTF-8"?>';
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    // Home Page
    $xml .= '  <url>';
    $xml .= '    <loc>'.url('/').'</loc>';
    $xml .= '    <lastmod>'.date('Y-m-d').'</lastmod>';
    $xml .= '    <changefreq>daily</changefreq>';
    $xml .= '    <priority>1.0</priority>';
    $xml .= '  </url>';

    // Subscription Page
    $xml .= '  <url>';
    $xml .= '    <loc>'.route('subscription').'</loc>';
    $xml .= '    <lastmod>'.date('Y-m-d').'</lastmod>';
    $xml .= '    <changefreq>weekly</changefreq>';
    $xml .= '    <priority>0.9</priority>';
    $xml .= '  </url>';

    // Events List Page
    $xml .= '  <url>';
    $xml .= '    <loc>'.route('events.index').'</loc>';
    $xml .= '    <lastmod>'.(count($events) > 0 && isset($events[0]->updated_at) ? $events[0]->updated_at->format('Y-m-d') : date('Y-m-d')).'</lastmod>';
    $xml .= '    <changefreq>daily</changefreq>';
    $xml .= '    <priority>0.8</priority>';
    $xml .= '  </url>';

    $xml .= '</urlset>';

    return response($xml, 200)->header('Content-Type', 'text/xml');
});

// ✅ تم حذف روابط الاختبار التالية لأسباب أمنية:
//    - GET  /seed-test-data        ← كانت تبذر بيانات وتعرض معلومات النظام
//    - GET  /boarding-test         ← كانت تعرض FCM tokens الخاصة بأولياء الأمور
//    - POST /boarding-test/trigger ← كانت تسمح بإرسال إشعارات مزيفة
//
// البديل: استخدم Artisan Commands بدلاً منها:
//    php artisan tinker
//    php artisan db:seed --class=TestDataSeeder

// 🟢 أولاً: روابط مدير الشركة (Admin)
Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', function () {
            return redirect()->route('admin.dashboard');
        });
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        // המدارس
        Route::get('/schools', [SchoolController::class, 'index'])->name('schools.index');
        Route::get('/schools/create', [SchoolController::class, 'create'])->name('schools.create');
        Route::post('/schools', [SchoolController::class, 'store'])->name('schools.store');
        Route::get('schools/{school}', [SchoolController::class, 'show'])->name('schools.show');
        Route::get('schools/{school}/edit', [SchoolController::class, 'edit'])->name('schools.edit');
        Route::put('schools/{school}', [SchoolController::class, 'update'])->name('schools.update');
        Route::delete('schools/{school}', [SchoolController::class, 'destroy'])->name('schools.destroy');
        Route::post('schools/{school}/toggle', [SchoolController::class, 'toggleStatus'])->name('schools.toggle');

        // Plans & Financials
        Route::resource('plans', PlanController::class);
        Route::post('plans/{plan}/toggle', [PlanController::class, 'toggle'])->name('plans.toggle');

        Route::get('subscriptions', [SubscriptionController::class, 'index'])->name('subscriptions.index');
        Route::put('subscriptions/{subscription}', [SubscriptionController::class, 'update'])->name('subscriptions.update');
        Route::delete('subscriptions/{subscription}', [SubscriptionController::class, 'destroy'])->name('subscriptions.destroy');
        Route::post('subscriptions/{subscription}/approve', [SubscriptionController::class, 'approve'])->name('subscriptions.approve');
        Route::post('subscriptions/{subscription}/reject', [SubscriptionController::class, 'reject'])->name('subscriptions.reject');
        Route::post('subscriptions/{subscription}/pause', [SubscriptionController::class, 'pause'])->name('subscriptions.pause');
        Route::post('subscriptions/{subscription}/resume', [SubscriptionController::class, 'resume'])->name('subscriptions.resume');
        Route::get('installments', [SubscriptionController::class, 'installmentsList'])->name('installments.index');
        Route::post('installments/{installment}/pay', [SubscriptionController::class, 'payInstallment'])->name('subscriptions.installments.pay');
        Route::get('transactions', [TransactionController::class, 'index'])->name('transactions.index');

        // مديرو المدارس - قائمة شاملة
        Route::get('school-admins', [SchoolUserController::class, 'index'])->name('school-admins.index');
        Route::post('school-admins', [SchoolUserController::class, 'store'])->name('school-admins.store');
        Route::put('school-admins/{user}', [SchoolUserController::class, 'update'])->name('school-admins.update');
        Route::delete('school-admins/{user}', [SchoolUserController::class, 'destroy'])->name('school-admins.destroy');
        Route::get('school-admins/export', [SchoolUserController::class, 'export'])->name('school-admins.export');
        Route::get('school-admins/template', [SchoolUserController::class, 'downloadTemplate'])->name('school-admins.template');
        Route::post('school-admins/import', [SchoolUserController::class, 'import'])->name('school-admins.import');

        Route::get('schools/{school}/admins/create', [SchoolUserController::class, 'create'])->name('schools.users.create');
        Route::post('schools/{school}/admins', [SchoolUserController::class, 'store'])->name('schools.users.store');
        Route::get('schools/{school}/admins/{user}/edit', [SchoolUserController::class, 'edit'])->name('schools.users.edit');
        Route::put('schools/{school}/admins/{user}', [SchoolUserController::class, 'update'])->name('schools.users.update');
        Route::delete('schools/{school}/admins/{user}', [SchoolUserController::class, 'destroy'])->name('schools.users.destroy');

        // المسارات
        Route::resource('routes', \App\Http\Controllers\Admin\RouteController::class);

        // Drivers Routes
        Route::get('drivers', [StaffController::class, 'index'])->name('drivers.index');
        Route::get('drivers/print-all', [StaffController::class, 'printAll'])->name('drivers.print-all');
        Route::get('drivers/export', [StaffController::class, 'export'])->name('drivers.export');
        Route::get('drivers/template', [StaffController::class, 'downloadTemplate'])->name('drivers.template');
        Route::post('drivers/import', [StaffController::class, 'import'])->name('drivers.import');
        Route::post('drivers', [StaffController::class, 'storeDriver'])->name('drivers.store');
        Route::put('drivers/{driver}', [StaffController::class, 'updateDriver'])->name('drivers.update');
        Route::delete('drivers/{driver}', [StaffController::class, 'destroyDriver'])->name('drivers.destroy');
        Route::get('drivers/{driver}/print', [StaffController::class, 'printCard'])->name('drivers.print');

        // المشرفين
        Route::get('assistants/print-all', [AssistantController::class, 'printAll'])->name('assistants.print-all');
        Route::get('assistants/export', [AssistantController::class, 'export'])->name('assistants.export');
        Route::get('assistants/template', [AssistantController::class, 'downloadTemplate'])->name('assistants.template');
        Route::post('assistants/import', [AssistantController::class, 'import'])->name('assistants.import');
        Route::get('assistants/{assistant}/print', [AssistantController::class, 'printCard'])->name('assistants.print');
        Route::resource('assistants', AssistantController::class)->except(['create', 'edit', 'show']);

        // المشرفين الميدانيين
        Route::get('field-supervisors/print-all', [\App\Http\Controllers\Admin\FieldSupervisorController::class, 'printAll'])->name('field-supervisors.print-all');
        Route::get('field-supervisors/export', [\App\Http\Controllers\Admin\FieldSupervisorController::class, 'export'])->name('field-supervisors.export');
        Route::get('field-supervisors/template', [\App\Http\Controllers\Admin\FieldSupervisorController::class, 'downloadTemplate'])->name('field-supervisors.template');
        Route::post('field-supervisors/import', [\App\Http\Controllers\Admin\FieldSupervisorController::class, 'import'])->name('field-supervisors.import');
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
        Route::delete('field-reports/{violation}', [\App\Http\Controllers\Admin\FieldReportController::class, 'destroy'])->name('field-reports.destroy');
        Route::resource('inspection-items', \App\Http\Controllers\Admin\InspectionItemController::class)->except(['create', 'show', 'edit']);
        Route::get('emergencies', [\App\Http\Controllers\Admin\EmergencyController::class, 'index'])->name('emergencies.index');
        Route::put('emergencies/{incident}/status', [\App\Http\Controllers\Admin\EmergencyController::class, 'updateStatus'])->name('emergencies.update-status');
        Route::delete('emergencies/{incident}', [\App\Http\Controllers\Admin\EmergencyController::class, 'destroy'])->name('emergencies.destroy');
        Route::get('inspection-logs', [\App\Http\Controllers\Admin\InspectionLogController::class, 'index'])->name('inspection-logs.index');
        Route::delete('inspection-logs/{inspection}', [\App\Http\Controllers\Admin\InspectionLogController::class, 'destroy'])->name('inspection-logs.destroy');
        Route::get('delay-logs', [\App\Http\Controllers\Admin\DelayLogController::class, 'index'])->name('delay-logs.index');
        Route::delete('delay-logs/{delay}', [\App\Http\Controllers\Admin\DelayLogController::class, 'destroy'])->name('delay-logs.destroy');

        // مراقبة المحادثات
        Route::get('chat', [\App\Http\Controllers\Admin\ChatMonitorController::class, 'index'])->name('chat.index');
        Route::get('chat/{conversation}', [\App\Http\Controllers\Admin\ChatMonitorController::class, 'show'])->name('chat.show');
        Route::delete('chat/messages/{message}', [\App\Http\Controllers\Admin\ChatMonitorController::class, 'deleteMessage'])->name('chat.messages.destroy');
        Route::post('chat/alert/{user}', [\App\Http\Controllers\Admin\ChatMonitorController::class, 'alertUser'])->name('chat.alert');

        // الرحلات الميدانية (Admin)
        Route::resource('field-trips', \App\Http\Controllers\Admin\FieldTripController::class)->except(['create', 'store', 'edit', 'destroy']);
        Route::post('field-trips/{field_trip}/approve', [\App\Http\Controllers\Admin\FieldTripController::class, 'approve'])->name('field-trips.approve');
        Route::post('field-trips/{field_trip}/reject', [\App\Http\Controllers\Admin\FieldTripController::class, 'reject'])->name('field-trips.reject');

        Route::get('daily-trips/validate-date', [\App\Http\Controllers\Admin\DailyTripController::class, 'validateDate'])->name('daily-trips.validate-date');
        Route::resource('daily-trips', \App\Http\Controllers\Admin\DailyTripController::class)
            ->parameters(['daily-trips' => 'trip']);
        Route::post('daily-trips/auto-create', [\App\Http\Controllers\Admin\DailyTripController::class, 'autoCreate'])->name('daily-trips.auto-create');
        Route::post('daily-trips/{trip}/confirm', [\App\Http\Controllers\Admin\DailyTripController::class, 'confirm'])->name('daily-trips.confirm');

        // التقويم الدراسي والعطل (Admin)
        Route::resource('academic-calendars', \App\Http\Controllers\Admin\AcademicCalendarController::class)->except(['create', 'show', 'edit']);
        Route::resource('holidays', \App\Http\Controllers\Admin\HolidayController::class)->except(['create', 'show', 'edit']);

        // Alias for notifications to fix frontend desyncs
        Route::prefix('notifications')->group(function () {
            Route::get('/all', [\App\Http\Controllers\NotificationController::class, 'page']);
            Route::get('/', [\App\Http\Controllers\NotificationController::class, 'index']);
            Route::post('/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
            Route::post('/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
            Route::delete('/{id}', [\App\Http\Controllers\NotificationController::class, 'destroy']);
            Route::delete('/', [\App\Http\Controllers\NotificationController::class, 'destroyAll']);
        });

        // مصاريف الحافلات والتقارير
        Route::get('bus-expenses/reports/consumption', [\App\Http\Controllers\Admin\BusReportController::class, 'getConsumptionReport'])->name('bus-expenses.reports.consumption');
        Route::get('bus-expenses/reports/export/pdf', [\App\Http\Controllers\Admin\BusReportController::class, 'exportPdf'])->name('bus-expenses.reports.export-pdf');
        Route::get('bus-expenses/reports/export/excel', [\App\Http\Controllers\Admin\BusReportController::class, 'exportExcel'])->name('bus-expenses.reports.export-excel');
        Route::resource('bus-expenses', \App\Http\Controllers\Admin\BusExpenseController::class);

        // التقارير التحليلية (Analytics Hub)
        Route::get('analytics', [\App\Http\Controllers\Admin\AnalyticsController::class, 'index'])->name('analytics.index');
        Route::get('analytics/operational', [\App\Http\Controllers\Admin\AnalyticsController::class, 'operational'])->name('analytics.operational');
        Route::get('analytics/drivers', [\App\Http\Controllers\Admin\AnalyticsController::class, 'driverAnalytics'])->name('analytics.drivers');
        Route::get('analytics/financial', [\App\Http\Controllers\Admin\AnalyticsController::class, 'financial'])->name('analytics.financial');
        Route::get('analytics/students', [\App\Http\Controllers\Admin\AnalyticsController::class, 'studentInsights'])->name('analytics.students');

        // إدارة الفعاليات والأخبار
        Route::resource('events', \App\Http\Controllers\Admin\EventController::class);

        Route::get('whatsapp', [\App\Http\Controllers\Admin\WhatsAppManagementController::class, 'index'])->name('whatsapp.index');
        Route::post('whatsapp/toggle-master', [\App\Http\Controllers\Admin\WhatsAppManagementController::class, 'toggleMasterSwitch'])->name('whatsapp.toggle-master');
        Route::post('whatsapp/toggle-template', [\App\Http\Controllers\Admin\WhatsAppManagementController::class, 'toggleTemplateSwitch'])->name('whatsapp.toggle-template');
        Route::post('whatsapp/send-test', [\App\Http\Controllers\Admin\WhatsAppManagementController::class, 'sendTestMessage'])->name('whatsapp.send-test');
        Route::post('whatsapp/retry/{log}', [\App\Http\Controllers\Admin\WhatsAppManagementController::class, 'retryMessage'])->name('whatsapp.retry');

        // إدارة النسخ الاحتياطي للنظام
        Route::get('backups', [\App\Http\Controllers\Admin\BackupManagementController::class, 'index'])->name('backups.index');
        Route::post('backups', [\App\Http\Controllers\Admin\BackupManagementController::class, 'store'])->name('backups.store');
        Route::get('backups/download/{fileName}', [\App\Http\Controllers\Admin\BackupManagementController::class, 'download'])->name('backups.download');
        Route::delete('backups/{fileName}', [\App\Http\Controllers\Admin\BackupManagementController::class, 'destroy'])->name('backups.destroy');

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
        Route::post('classrooms/grades', [ClassroomController::class, 'storeGrade'])->name('classrooms.grades.store');
        Route::put('classrooms/grades/{grade}', [ClassroomController::class, 'updateGrade'])->name('classrooms.grades.update');
        Route::delete('classrooms/grades/{grade}', [ClassroomController::class, 'destroyGrade'])->name('classrooms.grades.destroy');
        Route::resource('classrooms', ClassroomController::class);

        // 3. إدارة المعلمين والمشرفين
        Route::get('teachers/print-all', [TeacherController::class, 'printAll'])->name('teachers.print-all');
        Route::get('teachers/export', [TeacherController::class, 'export'])->name('teachers.export');
        Route::get('teachers/template', [TeacherController::class, 'downloadTemplate'])->name('teachers.template');
        Route::post('teachers/import', [TeacherController::class, 'import'])->name('teachers.import');
        Route::resource('teachers', TeacherController::class)->except(['show']);
        Route::resource('supervisors', \App\Http\Controllers\School\SupervisorController::class)->except(['show']);

        // 4. إدارة الطلاب
        Route::get('students-api', [StudentController::class, 'apiIndex'])->name('students.api');

        Route::get('students/export/all', [StudentController::class, 'export'])->name('students.export');
        Route::get('students/export/template', [StudentController::class, 'downloadTemplate'])->name('students.template');
        Route::post('students/import/all', [StudentController::class, 'import'])->name('students.import');

        Route::resource('students', StudentController::class);
        Route::post('students/{student}/update', [StudentController::class, 'update'])->name('students.update_post');
        Route::get('students/{student}/print', [StudentController::class, 'printCard'])->name('students.print');

        Route::post('guardians/search', [StudentController::class, 'searchGuardian'])->name('guardians.search');
        Route::post('guardians', [StudentController::class, 'storeGuardian'])->name('guardians.store');

        // إدارة أولياء الأمور
        Route::get('parents/export', [\App\Http\Controllers\School\GuardianController::class, 'export'])->name('parents.export');
        Route::get('parents/template', [\App\Http\Controllers\School\GuardianController::class, 'downloadTemplate'])->name('parents.template');
        Route::post('parents/import', [\App\Http\Controllers\School\GuardianController::class, 'import'])->name('parents.import');

        Route::resource('parents', \App\Http\Controllers\School\GuardianController::class)
            ->parameters(['parents' => 'parent'])
            ->except(['create', 'edit', 'show']);
        Route::delete('parents/{parent}/students/{student}', [\App\Http\Controllers\School\GuardianController::class, 'detachStudent'])->name('parents.students.detach');

        // 5. الحضور
        Route::middleware(['plan.feature:has_attendance'])->group(function () {
            Route::get('students/{student}/attendance', [StudentController::class, 'attendanceHistory'])->name('students.attendance');

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
        });

        Route::middleware([\App\Http\Middleware\CheckTransportAccess::class])->group(function () {
            // 6. الحافلات والرحلات
            Route::resource('buses', \App\Http\Controllers\School\BusController::class);
            Route::post('buses/bulk-destroy', [\App\Http\Controllers\School\BusController::class, 'bulkDestroy'])->name('buses.bulk-destroy');
            Route::resource('bus-groups', \App\Http\Controllers\School\BusGroupController::class);

            Route::get('buses/tracking/api', [\App\Http\Controllers\School\BusController::class, 'trackingApi'])->name('buses.tracking.api');
            Route::get('live-tracking', [\App\Http\Controllers\School\BusController::class, 'liveTracking'])->name('live-tracking.index');
            Route::get('bus-assignments', [\App\Http\Controllers\School\BusController::class, 'assignStudentsPage'])->name('buses.students.assign');
            Route::post('bus-assignments', [\App\Http\Controllers\School\BusController::class, 'saveAssignedStudents'])->name('buses.students.save');

            // السائقون والمشرفات
            Route::get('drivers', [\App\Http\Controllers\School\DriverController::class, 'index'])->name('drivers.index');
            Route::put('drivers/{driver}', [\App\Http\Controllers\School\DriverController::class, 'update'])->name('drivers.update');
            Route::get('assistants', [\App\Http\Controllers\School\AssistantController::class, 'index'])->name('assistants.index');
            Route::put('assistants/{assistant}', [\App\Http\Controllers\School\AssistantController::class, 'update'])->name('assistants.update');

            // طلبات الحافلات
            Route::get('bus-requests', [\App\Http\Controllers\School\BusRequestController::class, 'index'])->name('bus-requests.index');
            Route::post('bus-requests', [\App\Http\Controllers\School\BusRequestController::class, 'store'])->name('bus-requests.store');
            Route::put('bus-requests/{busRequest}', [\App\Http\Controllers\School\BusRequestController::class, 'update'])->name('bus-requests.update');
            Route::delete('bus-requests/{busRequest}', [\App\Http\Controllers\School\BusRequestController::class, 'destroy'])->name('bus-requests.destroy');

            // 7. الإشعارات
            Route::get('notifications/sent', [\App\Http\Controllers\School\NotificationController::class, 'sent'])->name('notifications.sent');
            Route::get('notifications/received', [\App\Http\Controllers\School\NotificationController::class, 'received'])->name('notifications.received');
            Route::resource('notifications', \App\Http\Controllers\School\NotificationController::class);
            Route::post('notifications/preview', [\App\Http\Controllers\School\NotificationController::class, 'preview'])->name('notifications.preview');
            Route::post('notifications/incidents/{incident}/resend', [\App\Http\Controllers\School\NotificationController::class, 'resendIncidentToParent'])->name('notifications.incidents.resend');

            Route::resource('routes', \App\Http\Controllers\School\RouteController::class);

            // Field Trips gating
            Route::middleware(['plan.feature:has_field_trips'])->group(function () {
                Route::resource('field-trips', \App\Http\Controllers\School\FieldTripController::class);
            });

            // Trips Dashboard
            Route::get('trips-dashboard', [\App\Http\Controllers\School\TripDashboardController::class, 'index'])->name('trips.dashboard');
            Route::get('trips/{trip}', [\App\Http\Controllers\School\TripDashboardController::class, 'show'])->name('trips.show');

            // Trip Reports
            Route::middleware(['plan.feature:has_reports'])->group(function () {
                Route::get('trip-reports', [\App\Http\Controllers\School\TripReportController::class, 'index'])->name('trip-reports.index');
                Route::get('trip-reports/data', [\App\Http\Controllers\School\TripReportController::class, 'getData'])->name('trip-reports.data');

                // School Reports Hub
                Route::get('reports', [\App\Http\Controllers\School\ReportController::class, 'index'])->name('reports.index');
                Route::get('reports/student-attendance', [\App\Http\Controllers\School\ReportController::class, 'studentAttendance'])->name('reports.student-attendance');
                Route::get('reports/trip-operations', [\App\Http\Controllers\School\ReportController::class, 'tripOperations'])->name('reports.trip-operations');
                Route::get('reports/safety-compliance', [\App\Http\Controllers\School\ReportController::class, 'safetyCompliance'])->name('reports.safety-compliance');
                Route::get('reports/driver-performance', [\App\Http\Controllers\School\ReportController::class, 'driverPerformance'])->name('reports.driver-performance');
                Route::get('reports/delay-punctuality', [\App\Http\Controllers\School\ReportController::class, 'delayPunctuality'])->name('reports.delay-punctuality');
                Route::get('reports/speed-discipline', [\App\Http\Controllers\School\ReportController::class, 'speedDiscipline'])->name('reports.speed-discipline');
            });
        });

        // Subscriptions & Plans
        Route::get('plans', [\App\Http\Controllers\School\SubscriptionController::class, 'plans'])->name('plans.index');
        Route::get('transactions', [\App\Http\Controllers\School\SubscriptionController::class, 'transactions'])->name('transactions.index');
        Route::post('installments/{installment}/receipt', [\App\Http\Controllers\School\SubscriptionController::class, 'uploadReceipt'])->name('installments.receipt');

        // School Settings
        Route::post('settings/school', [\App\Http\Controllers\School\SchoolSettingsController::class, 'update'])->name('settings.school.update');

        // 8. طلبات تغيير الموقع
        Route::get('location-requests', [\App\Http\Controllers\Admin\LocationRequestController::class, 'index'])->name('location-requests.index');
        Route::post('location-requests/{id}/approve', [\App\Http\Controllers\Admin\LocationRequestController::class, 'approve'])->name('location-requests.approve');
        Route::post('location-requests/{id}/reject', [\App\Http\Controllers\Admin\LocationRequestController::class, 'reject'])->name('location-requests.reject');

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

require __DIR__.'/auth.php';
