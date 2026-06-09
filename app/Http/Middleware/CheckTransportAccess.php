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

        if (!$school) {
            if ($user->hasRole('field_supervisor') || $user->hasRole('admin')) {
                return $next($request);
            }
            return $this->errorResponse($request, 'School not found.', 403);
        }

        // Check if modifying request (POST, PUT, DELETE)
        if (in_array($request->method(), ['POST', 'PUT', 'DELETE', 'PATCH'])) {
            $subscription = $school->subscriptions()->whereIn('status', ['active', 'paused'])->latest()->first();

            if ($subscription) {
                if ($subscription->status === 'paused') {
                    return $this->errorResponse($request, 'اشتراك المدرسة مجمد حالياً. لا يمكنك إجراء عمليات جديدة.', 403);
                }
                
                if ($subscription->grace_period_ends_at && \Carbon\Carbon::now()->isAfter($subscription->grace_period_ends_at)) {
                    return $this->errorResponse($request, 'انتهت فترة السماح للسداد. يرجى تسديد الأقساط المتأخرة لتفعيل الخدمة مجدداً.', 403);
                }
            }
        }

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
