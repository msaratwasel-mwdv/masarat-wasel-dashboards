<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log; // Added this line
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * تسجيل دخول المستخدم (ولي أمر / سائق / مشرف)
     */
    public function login(Request $request)
    {
        $request->validate([
            'national_id'  => 'required|string',
            'phone'        => 'required|string',
            'device_name'  => 'required|string',
        ]);

        // تنظيف المدخلات من أي مسافات زائدة قد تأتي من لوحة مفاتيح الجوال
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

        // حذف التوكنات القديمة لنفس الجهاز
        $user->tokens()->where('name', $request->device_name)->delete();

        $token = $user->createToken($request->device_name)->plainTextToken;

        return response()->json([
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
            'token' => $token,
        ]);
    }

    /**
     * تسجيل خروج المستخدم
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'تم تسجيل الخروج بنجاح.']);
    }

    /**
     * بيانات المستخدم الحالي
     */
    public function user(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * تسجيل FCM Token لاستقبال Push Notifications عبر Firebase
     * POST /api/auth/fcm-token
     *
     * يجب على Flutter App استدعاء هذا الـ endpoint بعد تسجيل الدخول وحصوله على FCM Token
     * لحفظ التوكن الخاص بجهاز المستخدم في Firebase Cloud Messaging.
     */
    public function registerFcmToken(Request $request)
    {
        $request->validate([
            'fcm_token' => 'required|string|max:500',
        ]);

        $request->user()->update([
            'fcm_token' => $request->fcm_token,
        ]);

        return response()->json(['message' => 'تم تسجيل FCM Token بنجاح.']);
    }
}
