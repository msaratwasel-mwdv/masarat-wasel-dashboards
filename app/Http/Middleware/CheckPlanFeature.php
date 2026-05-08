<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPlanFeature
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $user = $request->user();
        if (!$user) {
            return $request->wantsJson() || str_starts_with($request->path(), 'api/') 
                ? response()->json(['error' => 'Unauthenticated.'], 401) 
                : redirect()->route('login');
        }

        // Admins bypass
        if ($user->hasRole('admin') || $user->hasRole('super_admin')) {
            return $next($request);
        }

        $school = $user->school;
        
        if (!$school || !$school->hasFeature($feature)) {
            $message = 'عذراً، مدرستك غير مشتركة في هذا الملحق.';
            
            if ($request->wantsJson() || str_starts_with($request->path(), 'api/')) {
                return response()->json(['error' => $message], 403);
            }
            return redirect()->back()->with('error', $message);
        }

        return $next($request);
    }
}
