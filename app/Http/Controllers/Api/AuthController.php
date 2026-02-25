<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * تسجيل دخول المستخدم (ولي أمر / سائق / مشرف)
     */
    public function login(Request $request): JsonResponse
    {
        // إذا كان التطبيق يرسل email نستخدمه، وإلا نستخدم national_id و phone كما في نسخة Flutter
        if ($request->has('email')) {
            $request->validate([
                'email'       => 'required|email',
                'password'    => 'required',
                'device_name' => 'required|string|max:255',
            ]);

            $user = User::where('email', $request->email)->first();

            if (! $user || ! Hash::check($request->password, $user->password)) {
                throw ValidationException::withMessages([
                    'email' => ['بيانات الدخول غير صحيحة.'],
                ]);
            }
        } else {
            $request->validate([
                'national_id'  => 'required|string',
                'phone'        => 'required|string',
                'device_name'  => 'required|string',
            ]);

            $nationalId = trim($request->national_id);
            $phone = trim($request->phone);

            $user = User::where('national_id', $nationalId)->first();

            if (! $user || ! Hash::check($phone, $user->password)) {
                Log::warning('[Auth] Failed login attempt', [
                    'input_id' => $nationalId,
                    'input_phone' => $phone,
                    'found_user' => $user ? 'Yes' : 'No',
                ]);

                throw ValidationException::withMessages([
                    'national_id' => ['بيانات الدخول غير صحيحة.'],
                ]);
            }
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['الحساب معطّل. تواصل مع الإدارة.'],
            ]);
        }

        // حذف التوكنات القديمة لنفس الجهاز لتجنب التراكم
        $user->tokens()->where('name', $request->device_name)->delete();

        // إنشاء Token جديد
        $token = $user->createToken($request->device_name)->plainTextToken;

        return response()->json([
            'success' => true,
            'data'    => [
                'user'  => [
                    'id'        => $user->id,
                    'name'      => $user->name,
                    'email'     => $user->email,
                    'phone'     => $user->phone,
                    'role'      => $user->role,
                    'school_id' => $user->school_id,
                ],
                'token' => $token,
            ],
            // For backward compatibility with the current Flutter app
            'user' => [
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'phone'     => $user->phone,
                'role'      => $user->role,
                'school_id' => $user->school_id,
            ],
            'token' => $token,
        ]);
    }

    /**
     * تسجيل الخروج وحذف Token الحالي
     */
    public function logout(Request $request): JsonResponse
    {
        /** @var \Laravel\Sanctum\PersonalAccessToken $token */
        $token = $request->user()->currentAccessToken();
        if ($token) {
            $token->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الخروج بنجاح.',
        ]);
    }

    /**
     * بيانات المستخدم الحالي
     */
    public function user(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data'    => [
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'phone'     => $user->phone,
                'role'      => $user->role,
                'school_id' => $user->school_id,
            ],
            // Backward compability
            'user' => [
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'phone'     => $user->phone,
                'role'      => $user->role,
                'school_id' => $user->school_id,
            ],
        ]);
    }

    /**
     * تسجيل FCM Token لاستقبال Push Notifications عبر Firebase
     * POST /api/auth/fcm-token
     */
    public function registerFcmToken(Request $request): JsonResponse
    {
        $request->validate([
            'fcm_token' => 'required|string|max:500',
        ]);

        $request->user()->update([
            'fcm_token' => $request->fcm_token,
        ]);

        return response()->json(['success' => true, 'message' => 'تم تسجيل FCM Token بنجاح.']);
    }
}
