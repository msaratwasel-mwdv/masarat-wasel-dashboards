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

        $schoolId = $user->school_id;
        if (!$schoolId) {
            return response()->json(['message' => 'No school assigned to user.'], 403);
        }

        // Check for active or trialing attendance subscription
        $hasAccess = Subscription::where('school_id', $schoolId)
            ->whereHas('plan', function ($q) {
                $q->where('type', 'attendance');
            })
            ->whereIn('status', ['active', 'trialing'])
            ->where('end_date', '>=', now()->toDateString())
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'message' => 'Your school does not have an active Attendance subscription.'
            ], 403);
        }

        return $next($request);
    }
}
