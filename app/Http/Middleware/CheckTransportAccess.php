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
            return $this->errorResponse($request, 'Unauthenticated.', 401);
        }

        $school = $user->school;

        return $next($request);
    }

    protected function errorResponse(Request $request, string $message, int $status = 403)
    {
        if ($request->wantsJson() || str_starts_with($request->path(), 'api/')) {
            return response()->json(['error' => $message], $status);
        }
        return redirect()->back()->with('error', $message);
    }
}
