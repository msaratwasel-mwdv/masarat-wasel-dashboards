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

        // التحقق من وجود جلسات نشطة على أجهزة أخرى لتطبيق الخدمات
        if ($appContext === 'services') {
            $otherTokensCount = $user->tokens()->where('name', '!=', $request->device_name)->count();
            if ($otherTokensCount > 0) {
                $bus = $this->getBusForUser($user);

                // 🛡️ السائق: يُمنع من الدخول من جهاز آخر عند وجود أي رحلة نشطة
                if ($user->role === 'driver' && $bus) {
                    $hasActiveTrip = \App\Models\Trip::where('bus_id', $bus->id)
                        ->whereDate('trip_date', today())
                        ->whereIn('status', ['in_progress', 'awaiting_confirmation', 'awaiting_video'])
                        ->exists();

                    if ($hasActiveTrip) {
                        Log::warning('[Auth] Rejecting driver login: Active trip with existing session', [
                            'user_id' => $user->id, 'bus_id' => $bus->id,
                        ]);
                        return response()->json([
                            'success' => false,
                            'message' => 'لا يمكن تسجيل الدخول من جهاز آخر أثناء الرحلة.',
                            'errors' => ['national_id' => ['لا يمكن تسجيل الدخول من جهاز آخر أثناء الرحلة.']]
                        ], 422);
                    }
                }

                // 🛡️ مشرفة الحافلة (assistant):
                // - مسموح بالدخول عندما الرحلة بانتظار موافقتها (awaiting_confirmation) → تحتاج للموافقة
                // - ممنوع الدخول بعد الموافقة (in_progress / awaiting_video) → الرحلة تسير بالفعل
                if ($user->role === 'assistant' && $bus) {
                    $activeAfterApproval = \App\Models\Trip::where('bus_id', $bus->id)
                        ->whereDate('trip_date', today())
                        ->whereIn('status', ['in_progress', 'awaiting_video'])
                        ->exists();

                    if ($activeAfterApproval) {
                        Log::warning('[Auth] Rejecting assistant login: Trip already approved and in progress', [
                            'user_id' => $user->id, 'bus_id' => $bus->id,
                        ]);
                        return response()->json([
                            'success' => false,
                            'message' => 'لا يمكن تسجيل الدخول من جهاز آخر بعد الموافقة على الرحلة.',
                            'errors' => ['national_id' => ['لا يمكن تسجيل الدخول من جهاز آخر بعد الموافقة على الرحلة.']]
                        ], 422);
                    }
                    // إذا الرحلة awaiting_confirmation → يُسمح بالدخول (لتوافق عليها)
                    // سيُكمل التنفيذ ويمسح التوكنات القديمة أدناه
                }

                // مسح التوكنات القديمة للجميع الذين وصلوا لهذه النقطة والسماح بالدخول
                $user->tokens()->delete();
            }
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

        $userData = [
            'id'          => $user->id,
            'name'        => $user->name,
            'name_en'     => $user->name_en,
            'national_id' => $user->national_id,
            'email'       => $user->email,
            'phone'       => $user->phone,
            'role'        => $user->role,
            'image_url'   => $user->avatar_url,
            'school_id'   => $user->school_id,
            'school_name'        => $user->school ? $user->school->name : null,
            'preferred_language' => $user->preferred_language ?? 'ar',
            'bus_id'             => $this->getBusId($user),
            'bus'                => $this->getBusDetails($user),
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

        $userData = [
            'id'          => $user->id,
            'name'        => $user->name,
            'name_en'     => $user->name_en,
            'national_id' => $user->national_id,
            'email'       => $user->email,
            'phone'       => $user->phone,
            'role'        => $user->role,
            'image_url'   => $user->avatar_url,
            'school_id'   => $user->school_id,
            'school_name'        => $user->school ? $user->school->name : null,
            'preferred_language' => $user->preferred_language ?? 'ar',
            'bus_id'             => $this->getBusId($user),
            'bus'                => $this->getBusDetails($user),
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
        }
        
        return response()->json(['success' => true]);
    }

        /**
     * إزالة FCM Token يدوياً (مثلاً عند تعطيل التنبيهات)
     * POST /api/auth/fcm-token/delete
     */
    public function deleteFcmToken(Request $request): JsonResponse
    {
        $request->validate([
            'fcm_token' => 'required|string',
        ]);

        \App\Models\FcmToken::where('user_id', $request->user()->id)
            ->where('token', $request->fcm_token)
            ->delete();

        return response()->json(['success' => true, 'message' => 'تم إزالة FCM Token بنجاح.']);
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
     * استعادة كلمة المرور عبر الرقم المدني (تُعاد إلى رقم الجوال المسجل)
     * POST /api/auth/forgot-password
     * (غير محمي بـ Sanctum - المستخدم ليس مسجلاً دخوله)
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'national_id' => 'required|string',
        ], [
            'national_id.required' => 'الرقم المدني مطلوب.',
        ]);

        $nationalId = trim($request->national_id);

        $user = User::where('national_id', $nationalId)->first();

        if (! $user) {
            Log::warning('[Auth] Failed forgot-password attempt: User not found', [
                'national_id' => $nationalId,
            ]);

            throw ValidationException::withMessages([
                'national_id' => ['الرقم المدني غير مسجل لدينا.'],
            ]);
        }

        // الحصول على رقم الجوال المسجل
        $phone = trim($user->phone);

        if (empty($phone)) {
            return response()->json([
                'success' => false,
                'message' => 'عذراً، لا يوجد رقم جوال مسجل لهذا الحساب. يرجى التواصل مع الإدارة.',
            ], 422);
        }

        // إعادة تعيين كلمة المرور لرقم الجوال المسجل
        $user->update(['password' => $phone]); // 'hashed' cast يتكفل بالتشفير

        Log::info('[Auth] Password reset to phone via forgot-password', ['user_id' => $user->id]);

        return response()->json([
            'success' => true,
            'message' => 'تمت إعادة تعيين كلمة المرور إلى رقم جوالك المسجل بنجاح.',
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

    /**
     * الموافقة على طلب تسجيل الدخول لجهاز جديد
     */
    public function approveLoginAttempt(Request $request): JsonResponse
    {
        $request->validate([
            'login_attempt_id' => 'required|integer',
        ]);

        $attempt = \App\Models\LoginAttempt::where('id', $request->login_attempt_id)
            ->where('status', 'pending')
            ->first();

        if (!$attempt) {
            return response()->json([
                'success' => false,
                'message' => 'لم يتم العثور على طلب تسجيل الدخول أو تم معالجته بالفعل.'
            ], 404);
        }

        if ((int)$attempt->user_id !== (int)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بإجراء هذه العملية.'
            ], 403);
        }

        // تحديث الحالة للموافقة
        $attempt->update(['status' => 'approved']);

        // إلغاء كافة التوكنات السابقة للمستخدم لإجباره على تسجيل الخروج
        $user = $request->user();
        $user->tokens()->delete();

        // مسح FCM tokens القديمة باستثناء التوكن الخاص بالجهاز الجديد
        if ($attempt->fcm_token) {
            $user->fcmTokens()->where('token', '!=', $attempt->fcm_token)->delete();
        } else {
            $user->fcmTokens()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'تمت الموافقة بنجاح وسيتم تسجيل الخروج من هذا الجهاز.'
        ]);
    }

    /**
     * رفض طلب تسجيل الدخول لجهاز جديد
     */
    public function rejectLoginAttempt(Request $request): JsonResponse
    {
        $request->validate([
            'login_attempt_id' => 'required|integer',
        ]);

        $attempt = \App\Models\LoginAttempt::where('id', $request->login_attempt_id)
            ->where('status', 'pending')
            ->first();

        if (!$attempt) {
            return response()->json([
                'success' => false,
                'message' => 'لم يتم العثور على طلب تسجيل الدخول أو تم معالجته بالفعل.'
            ], 404);
        }

        if ((int)$attempt->user_id !== (int)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بإجراء هذه العملية.'
            ], 403);
        }

        // تحديث الحالة للرفض
        $attempt->update(['status' => 'rejected']);

        return response()->json([
            'success' => true,
            'message' => 'تم رفض طلب تسجيل الدخول.'
        ]);
    }

    /**
     * التحقق من حالة طلب تسجيل الدخول (غير محمي بـ Sanctum)
     */
    public function checkLoginAttemptStatus(Request $request): JsonResponse
    {
        $request->validate([
            'login_attempt_id' => 'required|integer',
            'temp_token' => 'required|string',
        ]);

        $attempt = \App\Models\LoginAttempt::where('id', $request->login_attempt_id)
            ->where('temp_token', $request->temp_token)
            ->first();

        if (!$attempt) {
            return response()->json([
                'success' => false,
                'message' => 'طلب غير صالح أو منتهي الصلاحية.'
            ], 404);
        }

        if ($attempt->status === 'pending') {
            return response()->json([
                'success' => false,
                'status' => 'pending',
                'message' => 'بانتظار موافقة الجهاز الآخر.'
            ]);
        }

        if ($attempt->status === 'rejected') {
            $attempt->delete(); // تنظيف الطلب المرفوض
            return response()->json([
                'success' => false,
                'status' => 'rejected',
                'message' => 'تم رفض طلب تسجيل الدخول من الجهاز الآخر.'
            ]);
        }

        if ($attempt->status === 'approved') {
            // تسجيل دخول المستخدم بنجاح
            $user = User::find($attempt->user_id);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'المستخدم غير موجود.'
                ], 404);
            }

            // تحديث FCM token للجهاز الجديد
            if ($attempt->fcm_token) {
                $user->updateFcmToken(
                    $attempt->fcm_token,
                    $attempt->device_type ?? 'android',
                    $attempt->device_name,
                    $attempt->device_id,
                    $attempt->app_context === 'services' ? 'com.msaratwasel.services' : 'com.msaratwasel.services'
                );
            }

            // إنشاء Token جديد للجهاز الجديد
            $token = $user->createToken($attempt->device_name)->plainTextToken;

            $userData = [
                'id'          => $user->id,
                'name'        => $user->name,
                'name_en'     => $user->name_en,
                'national_id' => $user->national_id,
                'email'       => $user->email,
                'phone'       => $user->phone,
                'role'        => $user->role,
                'image_url'   => $user->avatar_url,
                'school_id'   => $user->school_id,
                'school_name'        => $user->school ? $user->school->name : null,
                'preferred_language' => $user->preferred_language ?? 'ar',
                'bus_id'             => $this->getBusId($user),
                'bus'                => $this->getBusDetails($user),
            ];

            // مسح الطلب المكتمل
            $attempt->delete();

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

        return response()->json([
            'success' => false,
            'message' => 'حالة طلب غير صالحة.'
        ], 400);
    }
}


