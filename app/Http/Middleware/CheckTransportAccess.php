<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTransportAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            return $request->wantsJson() || str_starts_with($request->path(), 'api/') 
                ? response()->json(['error' => 'Unauthenticated.'], 401) 
                : redirect()->route('login');
        }

        $school = $user->school;

        if ($school && $school->transport_status == 0) {
            if ($request->wantsJson() || str_starts_with($request->path(), 'api/')) {
                return response()->json(['error' => 'Your school is currently blocked from accessing the transport system.'], 403);
            }
            return redirect()->back()->with('error', 'Your school is currently blocked from accessing the transport system.');
        }

        return $next($request);
    }
}
