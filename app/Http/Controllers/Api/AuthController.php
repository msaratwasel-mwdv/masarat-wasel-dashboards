<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
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
            'app_context' => 'nullable|string|in:services,parent', // تحديد التطبيق الذي يحاول الدخول
        ]);

        $nationalId = trim($request->national_id);

        $user = User::where('national_id', $nationalId)->first();

        // 1. التحقق من الرقم السري
        if (! $user || ! Hash::check($request->password, $user->password)) {
            Log::warning('[Auth] Failed login attempt', [
                'input_id' => $nationalId,
                'found_user' => $user ? 'Yes' : 'No',
            ]);

            throw ValidationException::withMessages([
                'national_id' => ['رقم الهوية أو كلمة السر غير صحيحة.'],
            ]);
        }

        // 2. التحقق من صلاحية الدخول للتطبيق المحدد (RBAC)
        $appContext = $request->input('app_context');

        if ($appContext === 'services') {
            // تطبيق الخدمات ممنوع على أولياء الأمور
            if ($user->role === 'parent') {
                Log::warning('[Auth] Rejecting Parent from Services app', ['user_id' => $user->id]);
                return response()->json([
                    'success' => false,
                    'message' => 'عذراً، حساب ولي الأمر لا يمكنه الدخول لتطبيق الخدمات. يرجى استخدام تطبيق "مسارات واصل" الخاص بك.',
                    'errors' => [
                        'national_id' => ['عذراً، حساب ولي الأمر لا يمكنه الدخول لتطبيق الخدمات. يرجى استخدام تطبيق "مسارات واصل" الخاص بك.']
                    ]
                ], 422);
            }
        } elseif ($appContext === 'parent') {
            // تطبيق ولي الأمر مخصص فقط لأولياء الأمور
            if ($user->role !== 'parent') {
                Log::warning('[Auth] Rejecting staff from Parent app', ['user_id' => $user->id, 'role' => $user->role]);
                return response()->json([
                    'success' => false,
                    'message' => 'عذراً، هذا التطبيق مخصص لأولياء الأمور فقط.',
                    'errors' => [
                        'national_id' => ['عذراً، هذا التطبيق مخصص لأولياء الأمور فقط.']
                    ]
                ], 422);
            }
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'national_id' => ['الحساب معطّل. تواصل مع الإدارة.'],
            ]);
        }

        // حفظ التوكن الخاص بـ Firebase إن وجد
        if ($request->has('fcm_token') && !empty($request->fcm_token)) {
            $user->updateFcmToken($request->fcm_token);
        }

        // حذف التوكنات القديمة لنفس الجهاز لتجنب التراكم
        $user->tokens()->where('name', $request->device_name)->delete();

        // إنشاء Token جديد
        $token = $user->createToken($request->device_name)->plainTextToken;

        // بناء رابط الصورة
        $imageUrl = null;
        if ($user->image) {
            $imageUrl = str_starts_with($user->image, 'http')
                ? $user->image
                : url(Storage::url($user->image));
        }

        $userData = [
            'id'          => $user->id,
            'name'        => $user->name,
            'name_en'     => $user->name_en,
            'national_id' => $user->national_id,
            'email'       => $user->email,
            'phone'       => $user->phone,
            'role'        => $user->role,
            'image_url'   => $imageUrl,
            'school_id'   => $user->getSchoolId(),
            'bus_id'      => $this->getBusId($user),
        ];

        return response()->json([
            'success' => true,
            'data'    => [
                'user'  => $userData,
                'token' => $token,
            ],
            'user'  => $userData,
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

        // بناء رابط الصورة
        $imageUrl = null;
        if ($user->image) {
            $imageUrl = str_starts_with($user->image, 'http')
                ? $user->image
                : url(Storage::url($user->image));
        }

        $userData = [
            'id'          => $user->id,
            'name'        => $user->name,
            'name_en'     => $user->name_en,
            'national_id' => $user->national_id,
            'email'       => $user->email,
            'phone'       => $user->phone,
            'role'        => $user->role,
            'image_url'   => $imageUrl,
            'school_id'   => $user->getSchoolId(),
            'bus_id'      => $this->getBusId($user),
        ];

        return response()->json([
            'success' => true,
            'data'    => $userData,
            'user'    => $userData,
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
     * تحديث بيانات الملف الشخصي (الهاتف، البريد)
     * POST /api/auth/profile/update
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:191|unique:users,email,' . $request->user()->id,
        ]);

        $request->user()->update($request->only(['phone', 'email']));

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث البيانات بنجاح.',
        ]);
    }

    /**
     * رفع صورة شخصية جديدة
     * POST /api/auth/profile/avatar
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $user = $request->user();

        // حذف الصورة القديمة إن وجدت
        if ($user->image && !str_starts_with($user->image, 'http')) {
            Storage::disk('public')->delete($user->image);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['image' => $path]);

        $imageUrl = url(Storage::url($path));

        return response()->json([
            'success'   => true,
            'message'   => 'تم تحديث الصورة بنجاح.',
            'image_url' => $imageUrl,
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


