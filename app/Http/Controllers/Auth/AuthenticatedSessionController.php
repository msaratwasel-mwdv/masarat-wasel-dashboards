<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response|RedirectResponse
    {
        // إذا كان المستخدم مسجل الدخول بالفعل، وجّهه مباشرة إلى لوحة التحكم الخاصة به
        // هذا يحل مشكلة: العميل يسجل الدخول ويرجع خطوة ثم يسجل مرة أخرى
        if (Auth::check()) {
            $user = Auth::user();

            if ($user->role === 'admin') {
                return redirect()->route('admin.dashboard');
            }

            if ($user->role === 'school_admin') {
                return redirect()->route('school.dashboard');
            }

            // أي دور آخر (مثل parent) لا يسمح له بالدخول للوحة التحكم
            Auth::guard('web')->logout();
            request()->session()->invalidate();
            request()->session()->regenerateToken();
        }

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // 👇 منطق التوجيه حسب الرتبة (The Traffic Cop)
        $user = $request->user();

        // منع أولياء الأمور من الدخول للوحة التحكم على الويب
        if ($user->role === 'parent') {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => 'عذراً، هذه البوابة مخصصة للإدارة فقط. يرجى استخدام تطبيق الجوال لولي الأمر.',
            ]);
        }

        $intended = session()->get('url.intended');

        if ($user->role === 'admin') {
            session()->forget('url.intended');
            if ($intended && str_contains($intended, '/admin') && ! str_contains($intended, '/login')) {
                return redirect()->to($intended);
            }

            return redirect()->route('admin.dashboard');
        }

        if ($user->role === 'school_admin') {
            // Check if the school is active
            $schoolAdmin = \App\Models\SchoolAdmin::with('school')->where('user_id', $user->id)->first();
            if ($schoolAdmin && $schoolAdmin->school && ! $schoolAdmin->school->is_active) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                throw ValidationException::withMessages([
                    'email' => 'حساب مدرستك قيد المراجعة والموافقة من الإدارة. يرجى الانتظار حتى تصلك رسالة التأكيد.',
                ]);
            }

            session()->forget('url.intended');
            if ($intended && str_contains($intended, '/school') && ! str_contains($intended, '/login')) {
                return redirect()->to($intended);
            }

            return redirect()->route('school.dashboard');
        }

        // إذا كان مستخدماً عادياً أو غير محدد، ولا يوجد له لوحة تحكم
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        throw ValidationException::withMessages([
            'email' => 'ليس لديك صلاحية للدخول إلى لوحة التحكم.',
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
