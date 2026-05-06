# ⚡ Part 3: Performance Bottlenecks — الاختناقات الأدائية

> [!WARNING]
> المشروع حالياً يعمل بسلاسة مع بضع عشرات من المستخدمين. المشاكل التالية ستظهر **فجأة** عند الوصول لـ 500+ مستخدم متزامن وستكون كارثية عند 10,000+.

---

## 🔴 الاختناق #1: HandleInertiaRequests — استعلام في كل طلب

**الملف**: [HandleInertiaRequests.php:37-46](file:///d:/laragon/www/masarat-wasel/app/Http/Middleware/HandleInertiaRequests.php#L37-L46)

```php
// ⚠️ هذا يُنفّذ في كل HTTP request واحد!
$recipientUnread = NotificationRecipient::where('user_id', $user->id)
    ->whereIn('status', ['sent', 'pending'])
    ->count();

$directUnread = Notification::where('user_id', $user->id)
    ->whereIn('status', ['sent', 'unread', 'pending'])
    ->count();
```

### التأثير:
- **2 SQL queries إضافية في كل request** — حتى requests لا تحتاج هذه البيانات
- مع 1,000 مستخدم متزامن = **2,000 query إضافية/ثانية**
- جدول notifications يكبر بسرعة → full table scans

### ✅ الحل:
```php
// Option 1: كاشينغ لمدة 30 ثانية
$unreadCount = Cache::remember(
    "user:{$user->id}:unread_notifications",
    30, // seconds
    function () use ($user) {
        return NotificationRecipient::where('user_id', $user->id)
            ->whereIn('status', ['sent', 'pending'])->count()
            + Notification::where('user_id', $user->id)
            ->whereIn('status', ['sent', 'unread', 'pending'])->count();
    }
);

// Option 2 (أفضل): أضف counter cache في users table
// unread_notifications_count INT DEFAULT 0
// وحدّثه عند إنشاء/قراءة إشعار
```

---

## 🔴 الاختناق #2: User::getSchoolId() — Dynamic Resolution

**الملف**: [User.php — getSchoolId()](file:///d:/laragon/www/masarat-wasel/app/Models/User.php)

```php
public function getSchoolId(): ?int
{
    // هذه الدالة تجري 3-5 queries كل مرة تُستدعى!
    // SchoolAdmin → school_id
    // Driver → school_id
    // Teacher → school_id
    // Guardian → students → enrollments → classrooms → school_id  ← 4 joins!
    // etc.
}
```

### أين تُستدعى:
```
StudentController::index()      → getSchoolId() ← 1
StudentController::create()     → getSchoolId() ← 2
StudentController::edit()       → getSchoolId() ← 3
StudentController::update()     → getSchoolId() ← 4
BusController::create()         → getSchoolId() ← 5
ChatController                  → getSchoolId() × 3 ← 6,7,8
HandleInertiaRequests            → $user->append('school') ← 9
AuthController                  → school_id ← 10
```

### التأثير:
- **~10 calls per page load** × 3-5 queries each = **30-50 queries** لكل طلب واحد!

### ✅ الحل:
```php
// 1. أضف school_id مباشرة في users table
Schema::table('users', function ($table) {
    $table->foreignId('school_id')->nullable()->constrained()->index();
});

// 2. أو استخدم cached accessor
public function getSchoolId(): ?int
{
    return Cache::remember(
        "user:{$this->id}:school_id",
        3600, // 1 hour
        fn() => $this->resolveSchoolId()
    );
}
```

---

## 🔴 الاختناق #3: N+1 Queries في ChatController::getValidContactsList()

**الملف**: [ChatController.php:31-132](file:///d:/laragon/www/masarat-wasel/app/Http/Controllers/Api/ChatController.php#L31-L132)

```php
// Parent case:
$myStudents = $user->students()
    ->with(['forthBus.assistant', 'forthBus.fieldSupervisor', 'forthBus.driver.user',
            'backBus.assistant', 'backBus.fieldSupervisor', 'backBus.driver.user'])
    ->get();

// ⚠️ ثم يُستدعى مرة ثانية في getConversations()!
$validContactIds = $this->getValidContactsList($user)->pluck('id')->toArray();
// وثالثة في sendMessage()!
$validContactIds = $this->getValidContactsList($user)->pluck('id')->toArray();
// ورابعة في getMessages()!
$validContactIds = $this->getValidContactsList($user)->pluck('id')->toArray();
```

### التأثير:
- `getValidContactsList()` تُستدعى **4 مرات** في كل محادثة
- كل استدعاء يُنفّذ **8-15 queries** مع eager loading
- مع 100 محادثة = **3,200-6,000 queries**!

### ✅ الحل:
```php
// 1. كاشينغ النتيجة في request lifecycle
private ?Collection $cachedContacts = null;

private function getValidContactsList(User $user): Collection
{
    return $this->cachedContacts ??= $this->resolveContacts($user);
}

// 2. أو أفضل: أضف middleware يحسب الـ valid contacts مرة واحدة
```

---

## 🔴 الاختناق #4: AnalyticsController — 20+ Queries بدون Caching

**الملف**: [AnalyticsController.php](file:///d:/laragon/www/masarat-wasel/app/Http/Controllers/Admin/AnalyticsController.php)

### index() method — Dashboard KPIs:
```
Query 1:  Trip::count()                      ← Full table scan
Query 2:  Trip::where('completed')::count()  ← Full table scan
Query 3:  Incident::distinct()->count()       ← Full table scan
Query 4:  Trip::whereRaw(EPOCH)::count()     ← Full scan + calculation
Query 5:  Bus::where('active')::get()         ← Full table scan
Query 6:  Student::whereIn(forth_bus)::count() ← Full table scan
Query 7:  Student::whereIn(back_bus)::count()  ← Full table scan
Query 8:  BusExpense::sum()                   ← Full table scan
Query 9:  Driver::count()                     ← Full table scan
Query 10: Violation::count()                  ← Full table scan
Query 11: Delay::count()                      ← Full table scan
```

### operational() method — 15+ queries
### driverAnalytics() method — 12+ queries
### studentInsights() method — 10+ queries

### التأثير:
- **Dashboard load = 50+ SQL queries**
- كل query يفحص **جداول كاملة** بدون استخدام كاش
- مع 10 مستخدمين يفتحون Analytics = **500 query/second**

### ✅ الحل:
```php
// 1. استخدم مبدأ "Pre-computed Snapshots"
// Scheduled Job يحسب KPIs كل 5 دقائق ويحفظها في Redis
public function index()
{
    $kpis = Cache::remember('analytics:kpis:' . now()->format('Y-m'), 300, function () {
        return $this->computeKpis();
    });
    
    return Inertia::render('Admin/Analytics/Index', ['kpis' => $kpis]);
}

// 2. أو استخدم materialized views في PostgreSQL
CREATE MATERIALIZED VIEW monthly_kpis AS
SELECT ... 
WITH DATA;

REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_kpis;
```

---

## 🔴 الاختناق #5: Bus::getStudentsCountAttribute() — N+1 في Loop

**الملف**: [Bus.php:266-274](file:///d:/laragon/www/masarat-wasel/app/Models/Bus.php#L266-L274)

```php
public function getStudentsCountAttribute(): int
{
    // ⚠️ هذا ينفّذ query جديد كل مرة يُستدعى!
    return Student::where(function ($query) {
        $query->where('forth_bus_id', $this->id)
            ->orWhere('back_bus_id', $this->id);
    })->where('is_active', true)->count();
}
```

### أين تُستدعى:
- عرض قائمة الباصات (Index) — مع 50 باص = **50 queries إضافية**
- عرض تفاصيل أي باص
- Dashboard widgets

### ✅ الحل:
```php
// 1. استخدم scopeWithStudentsCount الموجود أصلاً!
Bus::withStudentsCount()->get(); // ← subquery واحد بدل 50 query

// 2. أو counter cache
// أضف students_forth_count, students_back_count في buses table
// حدّثهم في StudentObserver
```

---

## 🔴 الاختناق #6: NotificationService::sendToUsers() — Sequential Loop

**الملف**: [NotificationService.php:138-155](file:///d:/laragon/www/masarat-wasel/app/Services/NotificationService.php#L138-L155)

```php
public function sendToUsers(array $userIds, ...): Collection
{
    $notifications = collect();
    foreach ($userIds as $userId) {
        // ⚠️ كل user = DB INSERT + FCM HTTP call + Logging
        $notifications->push(
            $this->sendToUser($userId, ...)
        );
    }
    return $notifications;
}
```

### التأثير:
- إشعار "بدء الرحلة" لـ 30 ولي أمر = **30 DB INSERTs + 30 FCM API calls** بشكل متسلسل
- كل FCM call يأخذ **200-500ms**
- إجمالي: **6-15 ثانية** لإرسال إشعار واحد!
- المستخدم (المشرفة) تنتظر طوال هذه المدة

### ✅ الحل:
```php
// 1. Bulk DB Insert
Notification::insert($notificationsData); // بدل 30 insert

// 2. FCM Multicast (حد أقصى 500 token في كل مرة)
$this->sendMulticast($allFcmTokens, $title, $message, $data);
// ← هذا موجود أصلاً! لكن لا يُستخدم في sendToUsers

// 3. Queue كل شيء
dispatch(new SendBulkNotifications($userIds, $type, $title, $message));
```

---

## 🟠 الاختناق #7: عدم استخدام Redis/Cache بالمرة

```bash
# .env الحالي
CACHE_STORE=database    # ⚠️ Cache في قاعدة البيانات = إضافة حمل عليها
QUEUE_CONNECTION=database  # ⚠️ Queue في قاعدة البيانات
SESSION_DRIVER=database    # ⚠️ Sessions في قاعدة البيانات
```

### التأثير:
- **كل** session, cache, queue job يمر عبر PostgreSQL
- مع 1,000 مستخدم: **آلاف الـ queries/second** على نفس قاعدة البيانات
- PostgreSQL ليس مصمماً ليكون Cache/Queue server

### ✅ الحل:
```bash
# استخدم Redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# أو على الأقل
SESSION_DRIVER=cookie  # ← لا يحتاج DB
CACHE_STORE=file       # ← أسرع من DB
```

---

## 🟠 الاختناق #8: Missing Database Indexes

### Indexes الناقصة:
```sql
-- users table — مستخدم في كل login + search
CREATE INDEX idx_users_national_id ON users(national_id);
-- ⚠️ موجود فقط كـ UNIQUE constraint، لكن ليس explicit index

-- students table — مستخدم في كل عرض باص
CREATE INDEX idx_students_forth_bus ON students(forth_bus_id) WHERE is_active = true;
CREATE INDEX idx_students_back_bus ON students(back_bus_id) WHERE is_active = true;

-- trip_attendances — مستخدم في كل boarding/alighting
CREATE INDEX idx_attendance_trip_student ON trip_attendances(trip_id, student_id);

-- buses table — مستخدم في كل bus listing
CREATE INDEX idx_buses_school_status ON buses(school_id, status);

-- notifications — يكبر بسرعة
CREATE INDEX idx_notifications_user_status_created 
    ON notifications(user_id, status, created_at DESC);

-- guardian_student pivot — مستخدم في كل student view
CREATE INDEX idx_guardian_student ON guardian_student(student_id, guardian_id);
```

---

## 🟡 الاختناق #9: Bus::getTripStatusAttribute() — Lazy Loading

**الملف**: [Bus.php:125-143](file:///d:/laragon/www/masarat-wasel/app/Models/Bus.php#L125-L143)

```php
public function getTripStatusAttribute(): string
{
    // ⚠️ يُنفّذ 1-2 queries كل مرة يُستدعى إذا العلاقة غير محمّلة
    $trip = $this->relationLoaded('activeTrip') ? $this->activeTrip : $this->activeTrip()->first();
    if (!$trip) {
        $lastTrip = $this->relationLoaded('latestTrip') ? $this->latestTrip : $this->latestTrip()->first();
        // ...
    }
}
```

---

## 📊 ملخص تقدير الأداء

### الوضع الحالي (تقريبي):

| السيناريو | العدد المقدّر للـ Queries | الوقت المتوقع |
|-----------|------------------------|---------------|
| فتح Dashboard (Admin) | 50-70 | 800ms-2s |
| فتح قائمة الباصات | 30-50 | 500ms-1s |
| إرسال إشعار لـ 30 ولي أمر | 90-120 | 6-15s |
| فتح صفحة Analytics | 40-60 | 1-3s |
| تسجيل ركوب طالب | 8-12 | 300-500ms |
| فتح Chat contacts | 20-40 | 500ms-1s |

### بعد التحسينات المقترحة:

| السيناريو | العدد المقدّر للـ Queries | الوقت المتوقع |
|-----------|------------------------|---------------|
| فتح Dashboard (Admin) | 3-5 (cached) | 50-100ms |
| فتح قائمة الباصات | 3-5 | 100-200ms |
| إرسال إشعار لـ 30 ولي أمر | 2-3 (queued) | 50ms (async) |
| فتح صفحة Analytics | 1-2 (cached) | 30-50ms |
| تسجيل ركوب طالب | 4-6 | 100-200ms |
| فتح Chat contacts | 3-5 (cached) | 100-200ms |

> [!TIP]
> **التحسين المتوقع**: **10x-50x** تحسن في سرعة الاستجابة عند تطبيق جميع التحسينات.
