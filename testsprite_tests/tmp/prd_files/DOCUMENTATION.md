# 📚 توثيق مشروع مسارات وصل - Masarat Wasel Dashboards

> **الإصدار:** 1.0  
> **تاريخ التوثيق:** فبراير 2026  
> **نوع المشروع:** نظام إدارة النقل المدرسي

---

## 📌 نظرة عامة

**مسارات وصل** هو نظام متكامل لإدارة النقل المدرسي، يشمل:

- لوحات تحكم متعددة المستويات (مدير الشركة / مدير المدرسة)
- تتبع الحافلات المدرسية في الوقت الفعلي
- إدارة الطلاب والأولياء والمعلمين
- نظام إشعارات متطور عبر FCM
- API للتطبيق المحمول (Flutter)

---

## 🛠️ التقنيات المستخدمة

### Backend

| التقنية         | الإصدار | الغرض                       |
| --------------- | ------- | --------------------------- |
| PHP             | ^8.2    | لغة البرمجة الرئيسية        |
| Laravel         | ^12.0   | إطار العمل                  |
| Laravel Sanctum | ^4.0    | مصادقة API                  |
| Inertia.js      | ^2.0    | ربط Backend بـ Frontend     |
| simple-qrcode   | ^4.2    | توليد رموز QR               |
| Ziggy           | ^2.0    | توجيه Laravel في JavaScript |

### Frontend

| التقنية            | الغرض                    |
| ------------------ | ------------------------ |
| React / TypeScript | واجهة المستخدم           |
| Vite               | بناء وتطوير الـ Frontend |
| Tailwind CSS       | التنسيق                  |

### قاعدة البيانات

| الإعداد     | القيمة            |
| ----------- | ----------------- |
| نوع         | MySQL             |
| المنفذ      | 3306              |
| اسم القاعدة | laravel (افتراضي) |
| المستخدم    | root              |

---

## 🚀 تشغيل المشروع

### المتطلبات

- PHP 8.2+
- Composer
- Node.js & npm
- MySQL
- Laragon (أو أي خادم ويب محلي)

### الخطوات

#### 1. تثبيت المتطلبات

```bash
composer install
npm install
```

#### 2. إعداد البيئة

```bash
cp .env.example .env
php artisan key:generate
```

#### 3. إعداد قاعدة البيانات (في ملف .env)

```env
DB_DATABASE=masarat_wasel
DB_USERNAME=root
DB_PASSWORD=
```

#### 4. تشغيل الـ Migrations

```bash
php artisan migrate
php artisan db:seed
```

#### 5. تشغيل المشروع (تطوير)

```bash
# الخيار الأول - تشغيل الكل دفعة واحدة
composer run dev

# الخيار الثاني - يدوي
php artisan serve       # Backend (Terminal 1)
npm run dev             # Frontend Vite (Terminal 2)
php artisan queue:work  # Queue Worker (Terminal 3)
```

#### 6. إعداد FCM (الإشعارات)

```env
FCM_SERVER_KEY=your_firebase_server_key_here
```

---

## 👥 أدوار المستخدمين (Roles)

| الدور        | المعرّف        | الصلاحيات                               |
| ------------ | -------------- | --------------------------------------- |
| مدير الشركة  | `admin`        | إدارة كاملة لجميع المدارس والحافلات     |
| مدير المدرسة | `school_admin` | إدارة مدرسته فقط (طلاب، معلمون، حافلات) |
| سائق         | `driver`       | API فقط - تحديث الموقع، تسجيل الركوب    |
| مشرف         | `supervisor`   | API فقط - إدارة ركوب الطلاب             |
| ولي أمر      | `guardian`     | API فقط - استقبال الإشعارات             |

---

## 🗂️ هيكل المشروع

```
masarat-wasel-dashboards/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/          ← تحكمات مدير الشركة
│   │   │   ├── School/         ← تحكمات مدير المدرسة
│   │   │   ├── Api/            ← تحكمات API للموبايل
│   │   │   ├── NotificationController.php
│   │   │   └── ProfileController.php
│   │   ├── Middleware/
│   │   └── Requests/
│   ├── Models/                 ← 20 نموذج
│   ├── Services/
│   │   └── NotificationService.php
│   ├── Observers/
│   └── Policies/
├── database/
│   ├── migrations/             ← 33 ملف migration
│   └── seeders/
├── resources/                  ← ملفات الـ Frontend (React)
├── routes/
│   ├── web.php                 ← روابط الويب
│   ├── api.php                 ← روابط API الموبايل
│   └── auth.php                ← روابط المصادقة
└── public/
```

---

## 🗺️ مخطط قاعدة البيانات

### الجداول الرئيسية

| الجدول                    | الوصف                                                     |
| ------------------------- | --------------------------------------------------------- |
| `users`                   | جميع المستخدمين (admin, school_admin, driver, supervisor) |
| `schools`                 | المدارس المسجلة                                           |
| `buses`                   | الحافلات المدرسية                                         |
| `students`                | الطلاب                                                    |
| `guardians`               | أولياء الأمور                                             |
| `classrooms`              | الفصول الدراسية                                           |
| `notifications`           | الإشعارات                                                 |
| `bus_boarding_logs`       | سجلات ركوب/نزول الطلاب                                    |
| `trip_schedules`          | جداول الرحلات                                             |
| `field_trips`             | الرحلات الميدانية                                         |
| `bus_students`            | ربط الطلاب بالحافلات                                      |
| `attendances`             | سجلات الحضور                                              |
| `assignment_histories`    | تاريخ تعيينات السائقين والمشرفين                          |
| `bus_requests`            | طلبات الحافلات من المدارس                                 |
| `bus_documents`           | وثائق الحافلات                                            |
| `notification_recipients` | مستقبلو الإشعارات                                         |
| `notification_templates`  | قوالب الإشعارات                                           |
| `driver_profiles`         | ملفات السائقين                                            |
| `supervisor_profiles`     | ملفات المشرفين                                            |

### العلاقات الرئيسية

```
School ──< Bus ──< TripSchedule
       ──< Classroom ──< Student ──> Guardian ──> User
       ──< BusRequest

Bus >── Driver (User)
    >── Supervisor (User)
    ──< BusBoardingLog
    ──< BusDocument
    >──< Student (bus_students)

Student >── Guardian
        >── School

Notification >── User (sender)
             >── User (recipient)
             ──< NotificationRecipient
```

---

## 🌐 الروابط والـ Routes

### لوحة تحكم مدير الشركة `/admin`

> **Middleware:** `auth`, `verified`, `role:admin`

| الرابط                             | الطريقة             | الوصف                 |
| ---------------------------------- | ------------------- | --------------------- |
| `/admin/dashboard`                 | GET                 | لوحة التحكم الرئيسية  |
| `/admin/schools`                   | GET/POST            | قائمة وإنشاء المدارس  |
| `/admin/schools/{id}`              | GET/PUT/DELETE      | عرض/تعديل/حذف مدرسة   |
| `/admin/schools/{id}/toggle`       | POST                | تغيير حالة المدرسة    |
| `/admin/schools/{id}/admins`       | POST                | إضافة مدير للمدرسة    |
| `/admin/drivers`                   | GET/POST/PUT/DELETE | إدارة السائقين        |
| `/admin/supervisors`               | Resource            | إدارة المشرفين        |
| `/admin/buses`                     | Resource            | إدارة الحافلات        |
| `/admin/buses/{id}/assign`         | POST                | تعيين حافلة لمدرسة    |
| `/admin/buses/{id}/archive`        | POST                | أرشفة حافلة           |
| `/admin/bus-requests`              | GET                 | عرض طلبات الحافلات    |
| `/admin/bus-requests/{id}/approve` | POST                | قبول طلب حافلة        |
| `/admin/bus-requests/{id}/reject`  | POST                | رفض طلب حافلة         |
| `/admin/assignmentHistory`         | GET                 | تقرير تاريخ التعيينات |

---

### لوحة تحكم مدير المدرسة `/school`

> **Middleware:** `auth`, `verified`, `role:school_admin`

| الرابط                             | الطريقة         | الوصف             |
| ---------------------------------- | --------------- | ----------------- |
| `/school/dashboard`                | GET             | لوحة التحكم       |
| `/school/classrooms`               | Resource        | إدارة الفصول      |
| `/school/teachers`                 | Resource        | إدارة المعلمين    |
| `/school/students`                 | Resource        | إدارة الطلاب      |
| `/school/guardians/search`         | POST            | البحث عن ولي أمر  |
| `/school/guardians`                | POST            | إضافة ولي أمر     |
| `/school/students/{id}/attendance` | GET             | سجل حضور طالب     |
| `/school/attendance`               | Resource        | إدارة الحضور      |
| `/school/attendance/bulk`          | POST            | تسجيل حضور جماعي  |
| `/school/buses`                    | Resource        | إدارة الحافلات    |
| `/school/buses/tracking/api`       | GET             | API تتبع الحافلات |
| `/school/bus-requests`             | POST/PUT/DELETE | طلبات الحافلات    |
| `/school/notifications`            | Resource        | إدارة الإشعارات   |
| `/school/trip-schedules`           | Resource        | جداول الرحلات     |
| `/school/field-trips`              | Resource        | الرحلات الميدانية |

---

### روابط مشتركة (جميع المستخدمين)

| الرابط                     | الوصف                  |
| -------------------------- | ---------------------- |
| `/profile`                 | عرض/تعديل الملف الشخصي |
| `/notifications`           | قائمة الإشعارات        |
| `/notifications/all`       | صفحة جميع الإشعارات    |
| `/notifications/{id}/read` | تحديد إشعار كمقروء     |
| `/notifications/read-all`  | تحديد الكل كمقروء      |

---

### API Routes (للتطبيق المحمول - Flutter)

> **Base URL:** `/api`

#### المصادقة (بدون حماية)

| الرابط            | الطريقة | الوصف        |
| ----------------- | ------- | ------------ |
| `/api/auth/login` | POST    | تسجيل الدخول |

#### روابط محمية بـ Sanctum

| الرابط                                  | الطريقة | الوصف                  |
| --------------------------------------- | ------- | ---------------------- |
| `/api/auth/logout`                      | POST    | تسجيل الخروج           |
| `/api/auth/user`                        | GET     | بيانات المستخدم الحالي |
| `/api/auth/fcm-token`                   | POST    | تسجيل FCM Token        |
| `/api/bus/{id}/board`                   | POST    | تسجيل ركوب طالب        |
| `/api/bus/{id}/alight`                  | POST    | تسجيل نزول طالب        |
| `/api/bus/{id}/passengers`              | GET     | قائمة الركاب الحاليين  |
| `/api/bus/{id}/location`                | POST    | تحديث موقع الحافلة     |
| `/api/guardian/notifications`           | GET     | إشعارات ولي الأمر      |
| `/api/guardian/notifications/{id}/read` | POST    | تحديد إشعار كمقروء     |

---

## 🔔 نظام الإشعارات

### NotificationService

الخدمة الرئيسية للإشعارات موجودة في `app/Services/NotificationService.php`

#### الوظائف المتاحة:

| الوظيفة                                        | الغرض                             |
| ---------------------------------------------- | --------------------------------- |
| `sendToUser($userId, $type, $title, $message)` | إرسال إشعار لمستخدم واحد          |
| `sendToUsers($userIds, ...)`                   | إرسال إشعار لعدة مستخدمين         |
| `notifyBusDrivers($busIds, ...)`               | إشعار سائقي حافلات محددة          |
| `notifyBusSupervisors($busIds, ...)`           | إشعار مشرفي حافلات محددة          |
| `notifyCompanyAdmins(...)`                     | إشعار جميع مديري الشركة           |
| `notifyStudentGuardian($studentId, ...)`       | إشعار ولي أمر طالب محدد           |
| `notifyBusStudentsGuardians($busId, ...)`      | إشعار أولياء أمور جميع طلاب حافلة |

### آلية العمل

1. يتم حفظ الإشعار في قاعدة البيانات (`notifications` table)
2. يتم إرسال Push Notification عبر **Firebase Cloud Messaging (FCM)**
3. في حالة فشل FCM، يستمر التطبيق بدون توقف (الخطأ يُسجَّل فقط)

### أنواع الإشعارات (type)

- **bus_proximity** - اقتراب الحافلة من المنزل
- **student_boarded** - ركوب الطالب الحافلة
- **student_alighted** - نزول الطالب من الحافلة
- **general** - إشعارات عامة

---

## 🚌 نظام تتبع الحافلات

### بيانات التتبع (في جدول `buses`)

| الحقل                  | النوع         | الوصف                               |
| ---------------------- | ------------- | ----------------------------------- |
| `current_latitude`     | decimal(10,7) | خط العرض الحالي                     |
| `current_longitude`    | decimal(10,7) | خط الطول الحالي                     |
| `last_location_update` | timestamp     | وقت آخر تحديث                       |
| `trip_status`          | enum          | حالة الرحلة (idle/active/returning) |

### حالات الحافلة (status)

- `active` - نشطة وتعمل
- `maintenance` - في الصيانة
- `inactive` - غير نشطة

---

## 📋 نماذج البيانات (Models)

| النموذج                   | الجدول                     | الوصف                                 |
| ------------------------- | -------------------------- | ------------------------------------- |
| `User`                    | users                      | المستخدمون (Sanctum + FCM Token)      |
| `School`                  | schools                    | المدارس (اسم، موقع، شعار، حالة)       |
| `Bus`                     | buses                      | الحافلات (تتبع، QR Code، مستندات)     |
| `Student`                 | students                   | الطلاب (صورة، جنس، رقم هوية)          |
| `Guardian`                | guardians                  | الأولياء (موقع المنزل، مسافة التنبيه) |
| `Classroom`               | classrooms                 | الفصول الدراسية                       |
| `Notification`            | notifications              | الإشعارات                             |
| `NotificationRecipient`   | notification_recipients    | مستقبلو الإشعارات                     |
| `NotificationTemplate`    | notification_templates     | قوالب الإشعارات                       |
| `BusBoardingLog`          | bus_boarding_logs          | سجلات ركوب/نزول الطلاب                |
| `TripSchedule`            | trip_schedules             | جداول الرحلات                         |
| `FieldTrip`               | field_trips                | الرحلات الميدانية                     |
| `FieldTripParticipant`    | field_trip_participants    | مشاركو الرحلات الميدانية              |
| `BusRequest`              | bus_requests               | طلبات الحافلات                        |
| `BusDocument`             | bus_documents              | وثائق الحافلات                        |
| `AssignmentHistory`       | assignment_histories       | تاريخ التعيينات                       |
| `Attendance`              | attendances                | سجلات الحضور                          |
| `DriverProfile`           | driver_profiles            | ملفات السائقين                        |
| `SupervisorProfile`       | supervisor_profiles        | ملفات المشرفين                        |
| `StudentSchoolEnrollment` | student_school_enrollments | تسجيل الطلاب بالمدارس                 |

---

## ⚙️ الإعدادات والتهيئة

### متغيرات البيئة (.env) المهمة

```env
# التطبيق
APP_NAME=Laravel
APP_ENV=local
APP_URL=http://localhost

# قاعدة البيانات
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=

# الجلسات والطوابير
SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

# Firebase (FCM)
FCM_SERVER_KEY=your_key_here
```

### الـ Queue (الطابور)

المشروع يستخدم Database Queue لمعالجة المهام المؤجلة. يجب تشغيل:

```bash
php artisan queue:work
```

أو للإنتاج (مستمر):

```bash
php artisan queue:listen --tries=1
```

---

## 🔒 المصادقة والحماية

### مصادقة الويب (Dashboard)

- يستخدم **Laravel Breeze** مع **Inertia.js**
- حماية Middleware: `auth`, `verified`
- تحكم في الأدوار عبر middleware: `role:admin`, `role:school_admin`

### مصادقة API (Mobile)

- يستخدم **Laravel Sanctum** (Personal Access Tokens)
- يتطلب header: `Authorization: Bearer {token}`
- endpoints محمية بـ `auth:sanctum`

---

## 🧪 الاختبار

```bash
# تشغيل الاختبارات
composer run test
# أو
php artisan test
```

---

## 📱 التكامل مع التطبيق المحمول

التطبيق المحمول (Flutter) يستخدم:

1. **API Endpoints** - `/api/*` للبيانات
2. **Sanctum Tokens** - للمصادقة
3. **FCM Tokens** - لاستقبال الإشعارات

### سيناريو أساسي: ركوب الطالب

```
1. السائق/المشرف يفتح التطبيق
2. POST /api/auth/login → يحصل على token
3. POST /api/bus/{id}/board → يسجل ركوب طالب
4. النظام تلقائياً:
   - يحفظ BusBoardingLog
   - يرسل إشعار FCM لولي الأمر
```

### سيناريو: تحديث موقع الحافلة

```
1. السائق في الرحلة
2. POST /api/bus/{id}/location (latitude, longitude)
3. النظام يحفظ الموقع في bus.current_latitude/longitude
4. Dashboard يعرض الموقع في الوقت الفعلي
```

---

## 📊 لوحات التحكم وصفحاتها

### لوحة مدير الشركة

- **Dashboard:** إحصائيات عامة (عدد المدارس، الحافلات، الطلاب)
- **المدارس:** إدارة شاملة مع إضافة مديرين
- **الحافلات:** إدارة الأسطول مع تخصيص للمدارس
- **السائقون والمشرفون:** إدارة الموظفين
- **طلبات الحافلات:** قبول/رفض طلبات المدارس
- **تقارير:** تاريخ التعيينات

### لوحة مدير المدرسة

- **Dashboard:** إحصائيات المدرسة
- **الفصول:** إدارة الفصول والمعلمين
- **الطلاب:** إدارة شاملة مع أولياء الأمور
- **الحضور:** تسجيل يومي ومجمّع
- **الحافلات:** إدارة حافلات المدرسة وتتبعها
- **الرحلات:** جداول الرحلات والرحلات الميدانية
- **الإشعارات:** إرسال إشعارات للأولياء والموظفين

---

## 📝 سجل التطوير (Changelog)

| التاريخ     | التغيير                                 |
| ----------- | --------------------------------------- |
| ديسمبر 2025 | إنشاء المشروع - جداول المدارس والفصول   |
| يناير 2026  | إضافة نظام الحافلات والطلاب والأولياء   |
| يناير 2026  | إضافة نظام الحضور والرحلات الميدانية    |
| يناير 2026  | تطوير نظام الإشعارات (v2) مع FCM        |
| فبراير 2026 | إضافة API للتطبيق المحمول (Sanctum)     |
| فبراير 2026 | إضافة سجلات ركوب/نزول الطلاب            |
| فبراير 2026 | إضافة تتبع موقع الأولياء وتنبيهات القرب |

---

_تم إنشاء هذا التوثيق تلقائياً بتاريخ فبراير 2026_
