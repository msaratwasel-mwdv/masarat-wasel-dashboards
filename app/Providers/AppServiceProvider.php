<?php

namespace App\Providers;

use App\Models\Student;
use App\Policies\StudentPolicy;
// ✅ 1. استيراد "البوابة" و "المودل" و "البوليسي"
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\Schema;
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
        //
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

        // Register BusRequest Observer for Notifications
        \App\Models\BusRequest::observe(\App\Observers\BusRequestObserver::class);
    }
}
