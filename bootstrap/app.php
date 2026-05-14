<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Sentry\Laravel\Integration;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\CheckUserRole::class,
            'plan.feature' => \App\Http\Middleware\CheckPlanFeature::class,
        ]);
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);

        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $exception, \Illuminate\Http\Request $request) {
            $status = $response->getStatusCode();
            
            // عرض صفحة الخطأ المخصصة دائماً لأخطاء 404 و 403 و 419
            // بينما الأخطاء البرمجية (500) نظهرها كصفحة مخصصة فقط إذا كان APP_DEBUG = false
            $showCustomError = false;
            
            if (in_array($status, [404, 403, 419])) {
                $showCustomError = true;
            } elseif (in_array($status, [500, 503]) && env('APP_DEBUG') == false) {
                $showCustomError = true;
            }

            if ($showCustomError) {
                return \Inertia\Inertia::render('Error', ['status' => $status])
                    ->toResponse($request)
                    ->setStatusCode($status);
            }

            return $response;
        });
    })->create();
