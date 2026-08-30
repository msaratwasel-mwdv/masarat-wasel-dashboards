<?php

namespace App\Providers;

use App\Models\Student;
use App\Policies\StudentPolicy;
// ✅ 1. استيراد "البوابة" و "المودل" و "البوليسي"
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Schema default string length.
     *
     * Register any application services.
     */
    public function register(): void
    {
        if ($this->app->isLocal()) {
            if (class_exists(\Clockwork\Support\Laravel\ClockworkServiceProvider::class)) {
                $this->app->register(\Clockwork\Support\Laravel\ClockworkServiceProvider::class);
            }
            if (class_exists(\Spatie\WebTinker\WebTinkerServiceProvider::class)) {
                $this->app->register(\Spatie\WebTinker\WebTinkerServiceProvider::class);
            }
            if (class_exists(\Laravel\Telescope\TelescopeServiceProvider::class) && class_exists(\App\Providers\TelescopeServiceProvider::class)) {
                $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
                $this->app->register(\App\Providers\TelescopeServiceProvider::class);
            }
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        Vite::prefetch(concurrency: 3); // ✅ سطر Vite الخاص بك موجود كما هو

        // ✅ 2. هذا هو السطر الذي يسجل "كتيب القواعد" في النظام
        Gate::policy(Student::class, StudentPolicy::class);

        // Register Observers for Cache Invalidation & Logic
        \App\Models\BusRequest::observe(\App\Observers\BusRequestObserver::class);
        \App\Models\Trip::observe(\App\Observers\TripObserver::class);
        \App\Models\TripAttendance::observe(\App\Observers\TripAttendanceObserver::class);
        \App\Models\Student::observe(\App\Observers\StudentObserver::class);
        \App\Models\User::observe(\App\Observers\UserObserver::class);
        \App\Models\Bus::observe(\App\Observers\BusObserver::class);
        \App\Models\Notification::observe(\App\Observers\NotificationObserver::class);
        \App\Models\NotificationRecipient::observe(\App\Observers\NotificationRecipientObserver::class);
        \App\Models\Incident::observe(\App\Observers\IncidentObserver::class);
        \App\Models\FieldTrip::observe(\App\Observers\FieldTripObserver::class);

        // Analytics models cache invalidation
        $analyticsObserver = \App\Observers\AnalyticsCacheObserver::class;
        \App\Models\Incident::observe($analyticsObserver);
        \App\Models\BusExpense::observe($analyticsObserver);
        \App\Models\Violation::observe($analyticsObserver);
        \App\Models\Delay::observe($analyticsObserver);
        \Log::debug('AppServiceProvider: Booting... Registering Broadcast routes with Sanctum.');
        \Illuminate\Support\Facades\Broadcast::routes(['middleware' => ['api', 'auth:sanctum']]);
    }
}
