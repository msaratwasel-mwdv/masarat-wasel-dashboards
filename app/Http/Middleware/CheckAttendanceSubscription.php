<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Subscription;

class CheckAttendanceSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Admins bypass
        if ($user->hasRole('admin') || $user->hasRole('super_admin')) {
            return $next($request);
        }

        $school = $user->school;
        
        if (!$school || !$school->hasFeature('has_attendance')) {
            return response()->json([
                'message' => 'Your school does not have an active Attendance subscription.'
            ], 403);
        }

        return $next($request);
    }
}
