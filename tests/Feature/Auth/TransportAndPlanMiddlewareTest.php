<?php

namespace Tests\Feature\Auth;

use App\Http\Middleware\CheckTransportAccess;
use App\Http\Middleware\SetAppLocale;
use App\Models\School;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Tests\TestCase;
use Tests\Traits\CreatesUsers;

class TransportAndPlanMiddlewareTest extends TestCase
{
    use CreatesUsers;

    public function test_set_app_locale_middleware_via_query_param(): void
    {
        $middleware = new SetAppLocale;

        $requestAr = Request::create('/api/auth/user?lang=ar', 'GET');
        $middleware->handle($requestAr, function () {
            $this->assertEquals('ar', app()->getLocale());

            return response()->json(['ok' => true]);
        });

        $requestEn = Request::create('/api/auth/user?lang=en', 'GET');
        $middleware->handle($requestEn, function () {
            $this->assertEquals('en', app()->getLocale());

            return response()->json(['ok' => true]);
        });
    }

    public function test_set_app_locale_middleware_via_accept_language_header(): void
    {
        $middleware = new SetAppLocale;

        $request = Request::create('/api/auth/user', 'GET');
        $request->headers->set('Accept-Language', 'en-US,en;q=0.9');

        $middleware->handle($request, function () {
            $this->assertEquals('en', app()->getLocale());

            return response()->json(['ok' => true]);
        });
    }

    public function test_check_transport_access_blocks_paused_subscriptions_on_post(): void
    {
        $school = School::factory()->create();
        $schoolAdmin = $this->createSchoolAdmin($school);

        $subscription = Subscription::factory()->create([
            'school_id' => $school->id,
            'status' => 'paused',
        ]);

        $middleware = new CheckTransportAccess;

        $request = Request::create('/api/trips', 'POST');
        $request->setUserResolver(fn () => $schoolAdmin);

        $response = $middleware->handle($request, function () {
            return response()->json(['ok' => true]);
        });

        $this->assertEquals(403, $response->getStatusCode());
    }
}
