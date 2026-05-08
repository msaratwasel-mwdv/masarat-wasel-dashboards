# 🚨 Part 2: Critical Failures — الأعطال الحرجة والثغرات الأمنية

> [!CAUTION]
> هذه المشاكل يجب حلها **فوراً** قبل أي إطلاق عام. أي منها يمكن أن يؤدي لاختراق أو فقدان بيانات.

---

## 🔴 CRITICAL #1: مفتاح Google Maps API مكشوف في الكود

**الملف**: [.env](file:///d:/laragon/www/masarat-wasel/.env#L81)
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAe06hLHmVeMhqnRYjcP6e5xHn-uM0VGG0
```

### لماذا هذا خطير؟
- `VITE_` prefix يعني أن المفتاح **يُرسل للمتصفح** ويصبح مرئياً لأي شخص
- يمكن لأي شخص سرقة المفتاح واستخدامه على حسابك
- Google Maps API ليست مجانية — يمكن أن يكلفك هذا **آلاف الدولارات**

### ✅ الحل
```diff
# 1. تقييد المفتاح في Google Cloud Console
#    - HTTP Referrer restrictions (allow only your domain)
#    - API restrictions (Maps JavaScript API only)
#
# 2. إنشاء مفتاح منفصل للـ Backend
- VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
+ VITE_GOOGLE_MAPS_API_KEY=<restricted_frontend_key>
+ GOOGLE_MAPS_SERVER_KEY=<restricted_backend_key>
```

---

## 🔴 CRITICAL #2: SystemCommandController — ثغرة تنفيذ أوامر النظام

**الملف**: [SystemCommandController.php](file:///d:/laragon/www/masarat-wasel/app/Http/Controllers/Admin/SystemCommandController.php)

هذا الكنترولر يسمح لأي Admin بتنفيذ أوامر على السيرفر:

```php
// يسمح بـ:
case 'git_pull':       // سحب كود من Git
case 'composer_update': // تحديث Dependencies
case 'npm_build':       // بناء Frontend
case 'migrate':         // تعديل قاعدة البيانات
case 'migrate_fresh_seed': // مسح قاعدة البيانات بالكامل!
```

### لماذا هذا خطير؟
1. **Remote Code Execution**: حتى مع whitelist، هذا يعطي Admin القدرة على تعديل كود السيرفر
2. **`migrate:fresh --seed`** يمسح **كل** البيانات — حتى لو فحصت Production env، يمكن التلاعب بالـ env variable
3. **لا يوجد logging** لمن نفّذ الأمر ومتى
4. **`composer update`** يمكن أن يسحب malicious package

### ✅ الحل
```php
// الخيار الأفضل: احذف هذا الكنترولر بالكامل
// واستخدم CI/CD pipeline بدلاً منه (GitHub Actions, GitLab CI)

// الخيار المؤقت: إذا لازم تبقيه، أضف:
// 1. IP Whitelist
// 2. 2FA confirmation
// 3. Audit logging
// 4. حذف migrate_fresh_seed تماماً
// 5. حذف composer_update
```

---

## 🔴 CRITICAL #3: `dd()` في Production Code

**الملف**: [StudentController.php:374](file:///d:/laragon/www/masarat-wasel/app/Http/Controllers/School/StudentController.php#L374)
```php
} catch (\Illuminate\Validation\ValidationException $e) {
    dd($e->errors()); // ⚠️ هذا يعرض تفاصيل النظام للمستخدم!
}
```

### لماذا هذا خطير؟
- `dd()` يوقف التطبيق ويعرض **stack trace** كامل
- يكشف **مسارات الملفات** على السيرفر
- يكشف **أسماء الجداول والأعمدة**
- يعطي المهاجم خريطة لقاعدة البيانات

### ✅ الحل
```diff
- } catch (\Illuminate\Validation\ValidationException $e) {
-     dd($e->errors());
- }
+ // Remove try-catch entirely — let Laravel handle validation errors naturally
```

---

## 🔴 CRITICAL #4: `env()` مستخدمة خارج Config

**الملف**: [GoogleMapsService.php:14](file:///d:/laragon/www/masarat-wasel/app/Services/GoogleMapsService.php#L14)
```php
$key = env('Maps_API_KEY');
```

### لماذا هذا خطير؟
- `env()` تعمل **فقط** قبل `config:cache`
- بعد `php artisan config:cache` (مطلوب في Production)، ستعيد `null`
- النظام سيتوقف عن العمل فجأة في Production

### ✅ الحل
```diff
// config/services.php
+ 'google_maps' => [
+     'key' => env('GOOGLE_MAPS_SERVER_KEY'),
+ ],

// GoogleMapsService.php
- $key = env('Maps_API_KEY');
+ $key = config('services.google_maps.key');
```

---

## 🔴 CRITICAL #5: لا يوجد Rate Limiting على API

**المشكلة**: جميع الـ API endpoints **بدون rate limiting**!

### لماذا هذا خطير؟
1. **Brute Force على Login**: يمكن تجربة ملايين كلمات المرور
2. **DDoS**: يمكن إغراق السيرفر بطلبات
3. **SMS/Notification Spam**: يمكن إرسال آلاف الإشعارات

### ✅ الحل
```php
// routes/api.php — أضف Rate Limiting
Route::post('/auth/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1'); // 5 محاولات كل دقيقة

// لجميع API routes
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // ...
});

// Notification endpoints — أكثر تشدداً
Route::post('/bus/{bus}/notify-near-house', ...)
    ->middleware('throttle:10,1');
```

---

## 🔴 CRITICAL #6: روابط Test/Debug مكشوفة في Web Routes

**الملف**: [web.php](file:///d:/laragon/www/masarat-wasel/routes/web.php#L34-L186)

```php
// ⚠️ هذه الروابط مكشوفة حتى لغير المسجلين!
Route::get('/seed-test-data', function () { ... });  // بذر بيانات تجريبية
Route::get('/boarding-test', function () { ... });   // اختبار الإشعارات
Route::post('/boarding-test/trigger', function () { ... }); // إرسال إشعارات
```

### لماذا هذا خطير؟
- `/seed-test-data` يعتمد على `app()->environment('production')` فقط — سهل التلاعب
- `/boarding-test` يعرض **FCM tokens** و **بيانات الطلاب**
- `/boarding-test/trigger` يمكنه إرسال إشعارات مزيفة

### ✅ الحل
```php
// احذف هذه الروابط بالكامل واستبدلها بـ:
// php artisan tinker أو artisan commands
```

---

## 🔴 CRITICAL #7: FCM Token يُحفظ في حقل غير موجود!

**الملف**: [AuthController.php:84](file:///d:/laragon/www/masarat-wasel/app/Http/Controllers/Api/AuthController.php#L83-L87)
```php
// في login()
if ($request->has('fcm_token') && !empty($request->fcm_token)) {
    $user->update(['fcm_token' => $request->fcm_token]);
    // ⚠️ لكن User model يقول: "fcm_token does NOT exist on the users table"!
}
```

و في [registerFcmToken](file:///d:/laragon/www/masarat-wasel/app/Http/Controllers/Api/AuthController.php#L199):
```php
$request->user()->update(['fcm_token' => $request->fcm_token]);
// ⚠️ نفس المشكلة — هذا الحقل غير موجود في fillable!
```

ولكن في User Model يوجد method `updateFcmToken()` الذي يحفظ في extension tables.

### المشكلة:
- `fcm_token` **غير موجود** في `$fillable` في User model
- `$user->update(['fcm_token' => ...])` **لا يفعل شيء** silently
- الإشعارات لن تعمل أبداً للمستخدمين الذين سجلوا دخول!

### ✅ الحل
```diff
// AuthController.php — login()
- $user->update(['fcm_token' => $request->fcm_token]);
+ $user->updateFcmToken($request->fcm_token);

// AuthController.php — registerFcmToken()
- $request->user()->update(['fcm_token' => $request->fcm_token]);
+ $request->user()->updateFcmToken($request->fcm_token);

// AuthController.php — logout()
- $user->update(['fcm_token' => null]);
+ $user->updateFcmToken(null);
```

---

## 🟠 HIGH #8: عدم وجود CSRF Protection على بعض POST Routes

```php
// web.php — هذه POST routes بدون middleware auth!
Route::post('/boarding-test/trigger', function () { ... });
```

---

## 🟠 HIGH #9: كلمة مرور ضعيفة في API

**الملف**: [AuthController.php:218](file:///d:/laragon/www/masarat-wasel/app/Http/Controllers/Api/AuthController.php#L218)
```php
'new_password' => 'required|string|min:6|confirmed',
```

- **6 أحرف فقط** — ضعيفة جداً
- لا يوجد **فحص تعقيد** (أرقام + حروف + رموز)
- لا يوجد **فحص قائمة كلمات المرور الشائعة**

### ✅ الحل
```php
'new_password' => ['required', 'string', 'min:8', 'confirmed',
    Password::min(8)->mixedCase()->numbers()
],
```

---

## 🟠 HIGH #10: لا يوجد Audit Trail / System Event Logging

- يوجد `SystemEventLog` model ولكن **لا يُستخدم** في أي controller
- العمليات الحساسة مثل:
  - تعديل بيانات الطلاب
  - تغيير تخصيصات الباصات
  - حذف المستخدمين
  - تنفيذ أوامر النظام
  
  **لا تُسجّل في أي سجل**!

---

## 🟡 MEDIUM #11: Guardian Password = Phone Number

**الملف**: [StudentController.php:208](file:///d:/laragon/www/masarat-wasel/app/Http/Controllers/School/StudentController.php#L208)
```php
'password' => Hash::make($validated['phone']),
```

- أي شخص يعرف رقم هاتف ولي الأمر يمكنه الدخول للنظام
- هذا يعني **جميع أولياء الأمور** لديهم كلمات مرور قابلة للتخمين

---

## 📊 ملخص الأعطال الحرجة

| # | الخطورة | المشكلة | الأثر |
|---|---------|---------|-------|
| 1 | 🔴 Critical | API Key مكشوف | خسائر مالية |
| 2 | 🔴 Critical | System Command Execution | Remote Code Execution |
| 3 | 🔴 Critical | `dd()` في Production | Information Disclosure |
| 4 | 🔴 Critical | `env()` خارج Config | App crash في Production |
| 5 | 🔴 Critical | لا Rate Limiting | Brute Force + DDoS |
| 6 | 🔴 Critical | Test routes مكشوفة | Data Leak + Notification Spam |
| 7 | 🔴 Critical | FCM Token لا يُحفظ | Push Notifications لا تعمل |
| 8 | 🟠 High | Missing CSRF | CSRF Attacks |
| 9 | 🟠 High | Weak Password Policy | Account Takeover |
| 10 | 🟠 High | No Audit Trail | Compliance Failure |
| 11 | 🟡 Medium | Phone as Password | Weak Authentication |

> [!IMPORTANT]
> **الزمن المقدّر لحل جميع الأعطال الحرجة**: 2-3 أيام عمل مركّز.
> يجب حلها **قبل أي خطوة أخرى**.
