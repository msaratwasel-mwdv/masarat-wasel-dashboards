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
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * تسجيل دخول المستخدم (ولي أمر / سائق / مشرف)
     */
    public function login(Request $request): JsonResponse
    {
        // تسجيل الدخول حصرياً عبر "الرقم المدني" و "كلمة السر"
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
                'national_id' => ['الرقم المدني أو كلمة السر غير صحيحة.'],
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

        // ✅ updateFcmToken() تحفظ في الجدول الصحيح حسب دور المستخدم
        // ❌ update(['fcm_token'=>...]) لا تفعل شيئاً لأن fcm_token غير موجود في $fillable
        if ($request->has('fcm_token') && !empty($request->fcm_token)) {
            $user->updateFcmToken(
                $request->fcm_token,
                $request->input('device_type', 'android'),
                $request->device_name,
                $request->input('device_id'),
                $request->input('app_bundle_id'),
                $request->input('preferred_language')
            );
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
            'school_id'   => $user->school_id,
            'school_name' => $user->school ? $user->school->name : null,
            'bus_id'      => $this->getBusId($user),
            'bus'         => $this->getBusDetails($user),
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
        $user = $request->user();
        if ($user) {
            // ✅ مسح توكن الإشعارات بالطريقة الصحيحة
            // Remove token for current device on logout
            if ($request->has('fcm_token')) {
                $user->fcmTokens()->where('token', $request->fcm_token)->delete();
            }

            /** @var \Laravel\Sanctum\PersonalAccessToken $token */
            $token = $user->currentAccessToken();
            if ($token) {
                $token->delete();
            }
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
            'school_id'   => $user->school_id,
            'school_name' => $user->school ? $user->school->name : null,
            'bus_id'      => $this->getBusId($user),
            'bus'         => $this->getBusDetails($user),
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
            'preferred_language' => 'nullable|string|in:ar,en',
        ]);

        try {
            // ✅ updateFcmToken() تحفظ في الجدول الصحيح
            $request->user()->updateFcmToken(
                $request->fcm_token,
                $request->input('device_type'),
                $request->input('device_name'),
                $request->input('device_id'),
                $request->input('app_bundle_id'),
                $request->input('preferred_language')
            );
        } catch (\Throwable $e) {
            Log::error("[FCM] Failed to register token: " . $e->getMessage());
            // نرجع نجاح لأننا لا نريد منع المستخدم من دخول التطبيق بسبب خطأ في التنبيهات
        }

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
            // ✅ متطلبات كلمة مرور احترافية:
            // - 8 أحرف كحد أدنى
            // - حرف كبير وحرف صغير على الأقل
            // - رقم واحد على الأقل
            'new_password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
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
            'email' => ['nullable', 'email', 'max:191', Rule::unique('users', 'email')->ignore($request->user()->id)],
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
        $bus = $this->getBusForUser($user);
        return $bus ? $bus->id : null;
    }

    private function getBusDetails(User $user): ?array
    {
        $bus = $this->getBusForUser($user);
        if ($bus) {
            return [
                'id' => $bus->id,
                'bus_number' => $bus->bus_number,
                'plate_number' => $bus->plate_number,
                'capacity' => $bus->capacity,
            ];
        }
        return null;
    }

    private function getBusForUser(User $user): ?Bus
    {
        if ($user->hasRole('driver')) {
            return $user->assignedBus;
        } elseif ($user->hasRole('assistant')) {
            return $user->assignedBusAsAssistant;
        } elseif ($user->hasRole('field_supervisor')) {
            return $user->assignedBusAsFieldSupervisor;
        }
        return null;
    }

    /**
     * Helper to get school name, checking classrooms if direct school is missing
     */
    private function getSchoolName(User $user): ?string
    {
        if ($user->school) {
            return $user->school->name;
        }

        if ($user->role === 'teacher') {
            $classroom = $user->classroom()->with('school')->first();
            if ($classroom && $classroom->school) {
                return $classroom->school->name;
            }
        }
        return null;
    }

    /**
     * تحديث اللغة المفضلة (ar / en)
     * POST /api/auth/profile/language
     */
    public function updateLanguage(Request $request): JsonResponse
    {
        $request->validate([
            'language' => 'required|string|in:ar,en',
        ]);

        $user = $request->user();

        try {
            // 1. Update the user's profile language
            $user->update([
                'preferred_language' => $request->language,
            ]);

            // 2. Also update ALL FCM tokens for this user
            //    so notification dispatch uses the correct language
            $user->fcmTokens()->update([
                'preferred_language' => $request->language,
            ]);
        } catch (\Throwable $e) {
            Log::error("[Language] Failed to update preferred language: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث اللغة بنجاح.',
        ]);
    }
}


