---
trigger: always_on
---

1. السياق العام للمشروع (Project Context)
المشروع: نظام ذكي لإدارة الحافلات المدرسية والطلاب (Smart Bus System).
التقنيات: Backend: Laravel (Monolith - Web + API) | Web: React 18+ (Inertia.js) | Mobile: Flutter (REST API) | Styling: Tailwind CSS 3+.

2. الهوية البصرية (UI/UX - React/Tailwind)
- أي واجهة جديدة يجب أن تتطابق مع الهوية الحالية. لا تخترع ألوان أو هوامش جديدة.
- استخدم المكونات من resources/js/Components قبل إنشاء مكون جديد.
- التزم بألوان tailwind.config: brand-dark, brand-yellow, brand-navy.
- كل صفحة يجب أن تدعم الوضع الليلي (isDark) واتجاه RTL (isRTL) عبر useTheme().
- استخدم AuthenticatedLayout دائماً للصفحات الداخلية.

3. معمارية الخلفية والـ API
- الكود يخدم واجهتين (Web + API). ضع المنطق في Services لتجنب التكرار.
- Controllers نحيفة. API يستخدم Eloquent Resources لتنسيق البيانات.
- التزم بهيكلة routes/api.php مع إصدارات (v1).
- استخدم route('admin.xxx') دائماً ولا تكتب URLs يدوياً.

4. مبادئ الصيانة
- قبل إضافة Migration جديدة، افحص الجداول الحالية لتجنب التكرار.
- لا تعدل ملفات الإعدادات (.env, composer.json, package.json, tailwind.config) بدون إذن.
- Naming: Controllers → PascalCase, routes → snake_case, Components → PascalCase.
