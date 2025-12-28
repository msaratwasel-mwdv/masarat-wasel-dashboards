<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckUserRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        // 1. التأكد أن المستخدم مسجل دخول
        if (! $request->user()) {
            return redirect()->route('login');
        }

        // 2. التأكد أن رتبة المستخدم تطابق الرتبة المطلوبة
        // إذا كان مطلوب 'admin' والمستخدم 'school_admin'، نمنعه
        if ($request->user()->role !== $role) {
            abort(403, 'ليس لديك صلاحية لدخول هذه الصفحة.');
        }

        return $next($request);
    }
}
