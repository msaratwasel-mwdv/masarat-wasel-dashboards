<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Bus;
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
        // تسجيل الدخول حصرياً عبر "رقم الهوية" و "كلمة السر"
        $request->validate([
            'national_id' => 'required|string',
            'password'    => 'required|string',
            'device_name' => 'required|string|max:255',
        ]);

        $nationalId = trim($request->national_id);

        $user = User::where('national_id', $nationalId)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            Log::warning('[Auth] Failed login attempt', [
                'input_id' => $nationalId,
                'found_user' => $user ? 'Yes' : 'No',
            ]);

            throw ValidationException::withMessages([
                'national_id' => ['رقم الهوية أو كلمة السر غير صحيحة.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'national_id' => ['الحساب معطّل. تواصل مع الإدارة.'],
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
                    'bus_id'    => $this->getBusId($user),
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
                'bus_id'    => $this->getBusId($user),
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
                'bus_id'    => $this->getBusId($user),
            ],
            // Backward compability
            'user' => [
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'phone'     => $user->phone,
                'role'      => $user->role,
                'school_id' => $user->school_id,
                'bus_id'    => $this->getBusId($user),
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

    /**
     * تغيير كلمة السر
     * POST /api/auth/change-password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:6|confirmed',
        ], [
            'current_password.required' => 'كلمة السر الحالية مطلوبة.',
            'new_password.required'     => 'كلمة السر الجديدة مطلوبة.',
            'new_password.min'          => 'كلمة السر الجديدة يجب أن تكون 6 أحرف على الأقل.',
            'new_password.confirmed'    => 'تأكيد كلمة السر غير مطابق.',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['كلمة السر الحالية غير صحيحة.'],
            ]);
        }

        $user->update([
            'password' => $request->new_password,  // 'hashed' cast handles hashing automatically
        ]);

        Log::info('[Auth] Password changed', ['user_id' => $user->id]);

        return response()->json([
            'success' => true,
            'message' => 'تم تغيير كلمة السر بنجاح.',
        ]);
    }

    /**
     * Helper to get bus_id for driver or supervisor
     */
    private function getBusId(User $user): ?int
    {
        if ($user->role === 'driver') {
            $bus = Bus::where('driver_id', $user->id)->first();
            return $bus ? $bus->id : null;
        } elseif ($user->role === 'supervisor') {
            $bus = Bus::where('supervisor_id', $user->id)->first();
            return $bus ? $bus->id : null;
        }

        return null;
    }
}
