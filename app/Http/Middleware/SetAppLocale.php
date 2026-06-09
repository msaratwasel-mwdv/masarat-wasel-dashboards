<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetAppLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = null;

        // 1. Check query parameter 'lang'
        if ($request->has('lang')) {
            $locale = $request->input('lang');
        }
        // 2. Check cookie 'locale' (for web/inertia dashboard)
        elseif ($request->hasCookie('locale')) {
            $locale = $request->cookie('locale');
        }
        // 3. Check 'Accept-Language' header (for API requests)
        elseif ($request->hasHeader('Accept-Language')) {
            $acceptLanguage = $request->header('Accept-Language');
            // Extract the first two characters (e.g., 'ar' from 'ar-EG,ar;q=0.9')
            $primaryLanguage = strtolower(substr($acceptLanguage, 0, 2));
            if (in_array($primaryLanguage, ['ar', 'en'])) {
                $locale = $primaryLanguage;
            }
        }
        // 4. Check authenticated user's preferred language
        elseif ($request->user() && $request->user()->preferred_language) {
            $locale = $request->user()->preferred_language;
        }

        if ($locale && in_array($locale, ['ar', 'en'])) {
            app()->setLocale($locale);
        }

        return $next($request);
    }
}
