<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAttendanceSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Admins bypass
        if ($user->hasRole('admin') || $user->hasRole('super_admin')) {
            return $next($request);
        }

        return $next($request);
    }
}
