# MASARAT WASEL — Architecture Standards & Golden Rulebook
> **Version:** 1.0 · **Last Updated:** 2026-05-18
> **Stack:** Laravel 12 + Inertia.js + React (TSX) + TanStack Table + Tailwind CSS + PostgreSQL
> **Established through:** Phases 1–3 (Drivers, Assistants, Print System)

---

## Table of Contents
1. [Database & Naming Architecture](#1-database--naming-architecture)
2. [Backend Controller Standard](#2-backend-controller-standard)
3. [UI/UX Modal & Form Standard](#3-uiux-modal--form-standard)
4. [Document Image Preview System](#4-document-image-preview-system)
5. [Dynamic Name Display & Fallback Logic](#5-dynamic-name-display--fallback-logic)
6. [Global Shared Print Architecture](#6-global-shared-print-architecture)
7. [Excel Import/Export Standard](#7-excel-importexport-standard)
8. [Dark Mode & Localization](#8-dark-mode--localization)
9. [Design System Tokens Reference](#9-design-system-tokens-reference)
10. [Quick-Start Checklist for New Modules](#10-quick-start-checklist-for-new-modules)

---

## 1. Database & Naming Architecture

### 1.1 The 4-Field Name Rule

All user-facing personnel are stored in the `users` table. Names are split into **4 atomic columns**:

| Column | Type | Rule |
|---|---|---|
| `first_name_ar` | `string` | `required_without:first_name_en` |
| `last_name_ar` | `string` | `required_with:first_name_ar` |
| `first_name_en` | `string` | `required_without:first_name_ar` |
| `last_name_en` | `string` | `required_with:first_name_en` |

**Conditional Required Logic:** The user MUST fill **at least one language pair** (Arabic OR English). If Arabic first name is provided, Arabic last name becomes required (and vice-versa for English). This is enforced with Laravel's `required_without` / `required_with` rules.

**Backend validation (exact pattern):**
```php
'first_name_ar' => 'required_without:first_name_en|nullable|string|max:255',
'last_name_ar'  => 'required_with:first_name_ar|nullable|string|max:255',
'first_name_en' => 'required_without:first_name_ar|nullable|string|max:255',
'last_name_en'  => 'required_with:first_name_en|nullable|string|max:255',
```

### 1.2 Computed Name Accessors (User Model)

The `User` model provides two virtual accessors appended via `$appends = ['name', 'name_en']`:

- **`name`** → `first_name_ar + last_name_ar` (fallback to `name_en` if empty)
- **`name_en`** → `first_name_en + last_name_en` (fallback to email if empty)

These accessors are the **single source of truth** for display names. Never manually concatenate names in frontend code.

### 1.3 Extension Table Pattern

Every role has a **1:1 extension table** linked via `user_id` as primary key:

| Role | Extension Table | Extension Model | Key Fields |
|---|---|---|---|
| `driver` | `drivers` | `Driver` | `license_number`, `license_expiry_date`, `status`, image fields |
| `assistant` | `assistants` | `Assistant` | `emergency_contact_name/phone`, `status`, image fields |
| `field_supervisor` | `field_supervisors` | `FieldSupervisor` | `status` |
| `school_admin` | `school_admins` | `SchoolAdmin` | `school_id` |

**Extension model config:**
```php
protected $primaryKey = 'user_id';
public $incrementing = false;
```

### 1.4 Role Assignment

Roles are assigned via the `user_roles` pivot table. Always use:
```php
$role = Role::firstOrCreate(['name' => 'driver']);
$user->roles()->attach($role->id);
// For imports (idempotent):
$user->roles()->syncWithoutDetaching([$role->id]);
```

### 1.5 Querying Users by Role

```php
$query = User::whereHas('roles', fn($q) => $q->where('name', 'driver'))
    ->with(['roles', 'driver', 'assignedBus.school']);
```

---

## 2. Backend Controller Standard

### 2.1 Controller Structure (Golden Template)

Every admin module controller follows this exact structure:

```
use \App\Traits\DataTableTrait;   // MANDATORY

1. index()         — List with applyDataTable()
2. store()         — Create (DB::transaction)
3. update()        — Update (DB::transaction)
4. destroy()       — Soft delete
5. printCard()     — Single card print (optional)
6. export()        — Excel download
7. downloadTemplate() — Blank Excel template
8. import()        — Excel import with error collection
9. printAll()      — Shared print report (Inertia::render)
```

### 2.2 Index Method Pattern

```php
public function index(Request $request)
{
    $statusFilter = $request->input('status', 'all');
    $query = User::whereHas('roles', fn($q) => $q->where('name', 'ROLE_NAME'))
        ->with(['roles', 'EXTENSION_RELATION', 'ASSIGNED_BUS_RELATION']);

    // Status filtering
    if ($statusFilter === 'assigned') {
        $query->whereHas('assignedBus');
    } elseif ($statusFilter === 'available') {
        $query->whereDoesntHave('assignedBus');
    }

    // CRITICAL: Only include columns that EXIST in the database
    $paginated = $this->applyDataTable($query, $request, [
        'name',          // Auto-expands to first_name_ar/en + last_name_ar/en
        'national_id',
        'phone',
        'email',
    ], 15, function($user) { /* export callback */ });

    // ... counts via Cache::remember() ...

    return Inertia::render('Admin/MODULE/Index', [
        'items'   => $paginated,
        'counts'  => $counts,
        'filters' => ['search' => $request->input('search', ''), 'status' => $statusFilter],
    ]);
}
```

> **CRITICAL WARNING:** The `applyDataTable` searchable columns array must ONLY contain columns that physically exist in the `users` database table. Never include virtual attributes like `user_code` unless the column exists. The trait builds raw SQL `WHERE column::text LIKE %search%` — non-existent columns cause PostgreSQL crashes.

### 2.3 Store/Update Pattern

Always wrap in `DB::transaction()`. For images, use the remove/replace pattern:
```php
if ($request->remove_image) {
    Storage::disk('public')->delete($user->image);
    $updateData['image'] = null;
} elseif ($request->hasFile('image')) {
    if ($user->image) Storage::disk('public')->delete($user->image);
    $updateData['image'] = $request->file('image')->store('avatars', 'public');
}
```

### 2.4 PrintAll Method (Shared Print)

```php
public function printAll(Request $request)
{
    $query = User::whereHas('roles', fn($q) => $q->where('name', 'ROLE'))
        ->with(['roles', 'extension', 'busRelation']);

    // MUST use ->get() (un-paginated!) then ->map()
    $data = $query->get()->map(function($user) {
        return [
            'name'    => $user->name,
            'name_en' => $user->name_en,
            // ... all needed fields ...
        ];
    });

    $userLang = $request->input('lang') ?? auth()->user()->preferred_language ?? 'ar';
    $isRTL = $userLang === 'ar';

    return Inertia::render('Print/SharedPrintReport', [
        'title_ar'    => 'تقرير بيانات ...',
        'title_en'    => '... Operational Report',
        'subtitle_ar' => 'إدارة شركة مسارات واصل',
        'subtitle_en' => 'Masarat Wasel Company',
        'columns'     => [
            ['key' => 'name', 'label_ar' => '...', 'label_en' => '...', 'bold' => true],
            // Nested keys supported: 'driver.license_number'
        ],
        'data'      => $data,
        'printDate' => now()->format('Y-m-d H:i:s'),
        'isRTL'     => $isRTL,
    ]);
}
```

---

## 3. UI/UX Modal & Form Standard

### 3.1 Single-Panel Scrollable Layout

**NEVER use multi-step wizards.** All forms use a **single scrollable panel** with logical CSS-grid sections:

```
Modal Structure:
├── DS_modalHeader (Navy bg, gold accent bar, white title)
├── <form> flex flex-col flex-1 min-h-0 overflow-hidden
│   ├── Scrollable Body: "flex-1 overflow-y-auto px-6 py-5 space-y-6 max-h-[78vh]"
│   │   ├── §1 Official Names (grid-cols-1 md:grid-cols-2)
│   │   ├── §2 Personal Identity & Documents (grid-cols-1 md:grid-cols-2)
│   │   ├── §3 Emergency Contact (if applicable)
│   │   └── §4 Contact & Preferences (grid-cols-1 md:grid-cols-3)
│   └── DS_modalFooter (Cancel + Submit buttons)
```

### 3.2 Section Headers

Each section has a header with icon, label, and optional hint badge:
```tsx
<h4 className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] border-b border-gray-100 dark:border-[#243460] pb-2 flex items-center gap-2">
    <Users size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
    {isRTL ? "الأسماء الرسمية" : "Official Names"}
</h4>
```

### 3.3 Name Fields Layout

Names are displayed in two side-by-side panels (Arabic | English), each containing a 2-column grid for first/last name. A conditional-required hint badge is shown:
```tsx
<span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded">
    {isRTL ? "* مطلوب عربي أو إنجليزي" : "* Req: Arabic or English"}
</span>
```

HTML `required` attribute is dynamically toggled:
```tsx
required={!data.first_name_en && !data.last_name_en}
```

### 3.4 Form Submission

**Direct submit, no steps.** The form `onSubmit` handler:
```tsx
const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentId) {
        post(route("admin.MODULE.update", currentId), {
            forceFormData: true,
            onSuccess: () => closeModal(),
        });
    } else {
        post(route("admin.MODULE.store"), { onSuccess: () => closeModal() });
    }
};
```

### 3.5 Optional Fields

Email and emergency contact fields are **optional** (`nullable` in backend, no `required` in frontend). Only Civil ID and Phone are required.

---

## 4. Document Image Preview System

### 4.1 Three-State Preview Pattern

Every image field follows a **3-state rendering** pattern:

```
State 1: New file selected    → URL.createObjectURL(data.field) + X button clears data
State 2: Existing server image → previewUrl from /storage/path + X button sets remove_field flag  
State 3: No image             → Placeholder icon + Upload label
```

### 4.2 Edit Modal Initialization

When opening Edit modal, existing server images MUST be mapped to preview state:
```tsx
const openEditModal = (item: Item) => {
    // Profile photo
    setPreviewImage(item.image ? `/storage/${item.image}` : null);
    // Documents (with fallback from extension table)
    const idFront = item.extension?.id_card_front_image || item.id_card_front_image;
    setPreviewIdCardFront(idFront ? `/storage/${idFront}` : null);
    // ... repeat for each document field
};
```

### 4.3 Image Preview JSX Template

```tsx
<div className="w-12 h-8 rounded border ... relative group">
    {data.field ? (
        <>
            <img src={URL.createObjectURL(data.field)} className="w-full h-full object-cover" />
            <button type="button" onClick={() => setData("field", null)}
                className="absolute inset-0 bg-black/50 ... opacity-0 group-hover:opacity-100">
                <X size={10} className="text-white" />
            </button>
        </>
    ) : previewField ? (
        <>
            <img src={previewField} className="w-full h-full object-cover" />
            <button type="button" onClick={() => {
                setPreviewField(null);
                setData("remove_field", true);
            }} className="absolute inset-0 bg-black/50 ... opacity-0 group-hover:opacity-100">
                <X size={10} className="text-white" />
            </button>
        </>
    ) : <PlaceholderIcon size={12} className="text-gray-400 dark:text-[#7ba7e8]/60" />}
</div>
```

### 4.4 Backend Remove Flag

The form data includes `remove_FIELD: false` booleans. On submit, backend checks:
```php
if ($request->remove_field) {
    Storage::disk('public')->delete($model->field);
    $data['field'] = null;
} elseif ($request->hasFile('field')) {
    // ... upload new
}
```

---

## 5. Dynamic Name Display & Fallback Logic

### 5.1 Table Grid Column

The primary name displays in the active UI language; the secondary name displays in the opposite language. Duplicates are suppressed:

```tsx
// Inside columnHelper.accessor("name", { cell: ... })
const driver = info.row.original;
return (
    <div className="flex flex-col">
        <span className={`text-sm font-black ${isDark ? "text-white" : "text-[#0f2044]"} tracking-tight`}>
            {isRTL ? (driver.name || driver.name_en) : (driver.name_en || driver.name)}
        </span>
        {(() => {
            const altName = isRTL ? driver.name_en : driver.name;
            const displayName = isRTL ? (driver.name || driver.name_en) : (driver.name_en || driver.name);
            if (altName && altName !== displayName) {
                return (
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                        {altName}
                    </span>
                );
            }
            return null;
        })()}
    </div>
);
```

### 5.2 Details Modal

Same pattern applies to the Dossier/Details modal header:
```tsx
<h2>  {isRTL ? (item.name || item.name_en) : (item.name_en || item.name)}  </h2>
<p>   {/* altName with duplicate check, same IIFE as above */}              </p>
```

### 5.3 Print Report

The `SharedPrintReport.tsx` resolves names via the `resolveValue` function:
```tsx
if (key === 'name') {
    return isRTL ? (row.name || row.name_en || "غير محدد") : (row.name_en || row.name || "—");
}
```

---

## 6. Global Shared Print Architecture

### 6.1 Location

`resources/js/Pages/Print/SharedPrintReport.tsx` — ONE file for ALL modules.

### 6.2 Props Interface

```typescript
interface Props {
    title_ar: string;       title_en: string;
    subtitle_ar: string;    subtitle_en: string;
    columns: { key: string; label_ar: string; label_en: string; mono?: boolean; bold?: boolean; }[];
    data: Record<string, any>[];
    printDate: string;
    isRTL: boolean;
    totalLabel_ar?: string; totalLabel_en?: string;
}
```

### 6.3 Key Features

- **Auto-print:** `useEffect(() => { setTimeout(() => window.print(), 600); }, []);`
- **Bilingual headers:** Uses `PrintReportHeader` component with company logo, title, date
- **Nested key resolution:** Supports `driver.license_number` via dot-notation split
- **RTL/LTR alignment:** `className={isRTL ? "text-right" : "text-left"}`
- **Footer:** Total count + "Official Signature: .........."
- **Language detection:** `$userLang = $request->input('lang') ?? auth()->user()->preferred_language ?? 'ar';`

### 6.4 Print Button (Frontend)

```tsx
onClick={() => {
    const lang = isRTL ? 'ar' : 'en';
    const url = route("admin.MODULE.printAll", {
        status: filters.status, search: filters.search, lang
    });
    window.open(url, "PrintReport", "width=1100,height=800,scrollbars=yes");
}}
```

### 6.5 NEVER Create Module-Specific Print Files

Do NOT create `Drivers/PrintAll.tsx` or `Assistants/PrintAll.tsx`. All modules render `Print/SharedPrintReport`.

---

## 7. Excel Import/Export Standard

### 7.1 Import Class Architecture

```php
class ModuleImport implements ToModel, SkipsEmptyRows, WithStartRow, WithChunkReading,
    WithBatchInserts, WithUpserts, WithValidation, SkipsOnFailure, SkipsOnError
{
    use SkipsFailures, SkipsErrors;
    public $successCount = 0;
    public function startRow(): int { return 3; }  // Skip instruction + header rows
    public function batchSize(): int { return 100; }
    public function chunkSize(): int { return 100; }
    public function uniqueBy() { return 'national_id'; }
}
```

### 7.2 Import Validation Rules

Use column indices (0, 1, 2...) matching the exact same 4-field conditional-required pattern:
```php
'0' => 'required_without:2|nullable|string|max:255',  // first_name_ar
'1' => 'required_with:0|nullable|string|max:255',     // last_name_ar
'2' => 'required_without:0|nullable|string|max:255',  // first_name_en
'3' => 'required_with:2|nullable|string|max:255',     // last_name_en
'4' => 'required|string|max:20',                       // national_id
'5' => 'required|string|max:20',                       // phone
```

### 7.3 Import Model Method

Use `User::updateOrCreate` keyed on `national_id`, then `syncWithoutDetaching` for roles, then `updateOrCreate` for extension table.

### 7.4 Controller Import Handler (Error Collection)

```php
public function import(Request $request) {
    $request->validate(['file' => 'required|mimes:xlsx,xls,csv|max:10240']);
    $import = new ModuleImport();
    try {
        Excel::import($import, $request->file('file'));
    } catch (\Throwable $e) {
        return redirect()->back()->with('import_errors',
            ["فشل في معالجة ملف الاستيراد: " . $e->getMessage()]);
    }
    $errorsArray = [];
    // 1. Collect validation failures (SkipsOnFailure)
    foreach ($import->failures() as $failure) {
        $errorsArray[] = "السطر {$failure->row()} | العمود: [{$col}] | القيمة: ({$val}) | الخطأ: {$errors}";
    }
    // 2. Collect DB/PHP exceptions (SkipsOnError)
    foreach ($import->errors() as $error) {
        $errorsArray[] = "خطأ: " . $error->getMessage();
    }
    if (!empty($errorsArray)) {
        return redirect()->back()
            ->with('success', "تم استيراد {$import->successCount} بنجاح.")
            ->with('import_errors', $errorsArray);
    }
    return redirect()->back()->with('success', "تم استيراد {$import->successCount} بنجاح.");
}
```

### 7.5 Frontend Error Alert Panel

Flash errors are shown in a bilingual expandable panel:
```tsx
{flash?.import_errors && (
    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl p-4">
        <h4 className="font-black text-rose-700 text-sm mb-2">
            {isRTL ? "تنبيهات الاستيراد" : "Import Alerts"}
        </h4>
        <ul className="space-y-1 text-xs text-rose-600">
            {flash.import_errors.map((err, i) => <li key={i}>• {err}</li>)}
        </ul>
    </div>
)}
```

---

## 8. Dark Mode & Localization

### 8.1 Color Palette

| Token | Light | Dark |
|---|---|---|
| Page bg | `bg-white` | `bg-[#1a2845]` |
| Primary text | `text-[#0f2044]` | `text-white` |
| Secondary text | `text-gray-400` | `text-gray-500` |
| Icon contrast | `text-[#0f2044]` | `text-[#7ba7e8]` ← **MANDATORY for dark icons** |
| Accent gold | `text-[#f5b800]` | `text-[#f5b800]` |
| Card border | `border-gray-100` | `border-[#243460]` |
| Section header icon | `text-[#f5b800]` | `text-[#7ba7e8]` |

### 8.2 Validation Error Translation (InputError Component)

`resources/js/Components/InputError.tsx` contains a `translateErrorMessage()` function with:
- **Arabic map:** Laravel's default English messages → Arabic translations
- **English map:** Laravel's default messages → clean user-friendly English

When adding new validation rules to new modules, you MUST add their error messages to both maps in `InputError.tsx`.

### 8.3 Calendar Dark Mode Fix

Date inputs in dark mode need an invert filter:
```tsx
className={`${DS_input} ${isDark ? '[color-scheme:dark]' : ''}`}
```

### 8.4 RTL Direction

Always wrap main content areas with `dir={isRTL ? 'rtl' : 'ltr'}`. The `isRTL` boolean comes from `useTheme()` context hook.

### 8.5 Theme Context

```tsx
const { isRTL, theme } = useTheme();
const isDark = theme === "dark";
```

---

## 9. Design System Tokens Reference

All tokens are imported from `@/lib/DS`. Key tokens:

| Token | Usage |
|---|---|
| `DS_pageWrapper` | Main page container spacing |
| `DS_card` | Card containers |
| `DS_pageTitle` | Page h1 titles |
| `DS_modalContainer` | Modal root: `max-h-[85vh]` flex column |
| `DS_modalHeader(isRTL)` | Navy header bar |
| `DS_modalHeaderTitle` | White bold title text |
| `DS_modalHeaderAccent` | Gold accent bar `w-2 h-6` |
| `DS_modalClose` | Close button styling |
| `DS_modalBody` | Scrollable body with padding |
| `DS_modalFooter(isRTL)` | Footer with border-top |
| `DS_input` | All text inputs (rounded-[14px]) |
| `DS_select` | All select dropdowns |
| `DS_label` | All field labels (10px, uppercase, tracking) |
| `DS_btnGold` | Primary action (gold bg) |
| `DS_btnPrimary` | Navy bg button |
| `DS_btnSecondary` | Outline/ghost button |
| `DS_btnEdit` | Edit action (small) |
| `DS_btnDanger` | Delete action (red) |
| `DS_statCard("navy"/"gold"/"green")` | Stat card wrapper |
| `DS_statIcon("navy"/"gold"/"green")` | Stat card icon bg |
| `DS_statValue2("navy"/"gold"/"green")` | Stat card value text |

---

## 10. Quick-Start Checklist for New Modules

When creating a new user management module (e.g., Field Supervisors, School Managers):

### Backend
- [ ] Create controller extending `Controller`, using `DataTableTrait`
- [ ] `index()` with `applyDataTable()` — searchable columns MUST exist in DB
- [ ] `store()` / `update()` with 4-field name validation + `DB::transaction`
- [ ] `destroy()` with soft delete
- [ ] `import()` with `SkipsOnFailure` + `SkipsOnError` + global try/catch
- [ ] `export()` + `downloadTemplate()`
- [ ] `printAll()` rendering `Print/SharedPrintReport` with bilingual props
- [ ] Register routes in `routes/web.php` under admin middleware group
- [ ] Create Import class with `startRow: 3`, bilingual messages, `uniqueBy: national_id`
- [ ] Create Export class with template mode support

### Frontend
- [ ] Create `resources/js/Pages/Admin/MODULE/Index.tsx`
- [ ] Import all DS tokens from `@/lib/DS`
- [ ] Use `BaseDataTable` + `createColumnHelper` from TanStack
- [ ] Name column with dynamic isRTL swap + duplicate suppression
- [ ] Single-panel modal form with logical sections (§1 Names, §2 Identity, §3 Contact)
- [ ] 3-state image preview for all document fields
- [ ] `openEditModal()` maps existing server images to preview state
- [ ] Print button opens SharedPrintReport in new window with `lang` param
- [ ] Import modal with file upload + bilingual error alert panel
- [ ] Filter tabs (All / Assigned / Available) with counts
- [ ] Details/Dossier modal with dynamic name swap
- [ ] Add new validation messages to `InputError.tsx` maps

### Design Rules
- [ ] **Never** create module-specific print files
- [ ] **Never** use multi-step wizard forms
- [ ] **Never** include non-existent DB columns in searchable arrays
- [ ] **Always** use `isRTL` from `useTheme()` (not DOM inspection)
- [ ] **Always** use DS tokens — never hardcode modal/input styles
- [ ] **Always** use `dark:text-[#7ba7e8]` for icon contrast in dark mode
- [ ] **Always** wrap content with `dir={isRTL ? 'rtl' : 'ltr'}`

---

## Appendix: File Locations

```
app/
├── Http/Controllers/Admin/
│   ├── StaffController.php          (Drivers — golden reference)
│   ├── AssistantController.php      (Assistants — golden reference)
│   ├── FieldSupervisorController.php (Phase 4 — to build)
│   └── SchoolManagerController.php   (Phase 5 — to build)
├── Imports/
│   ├── DriversImport.php            (golden reference)
│   └── AssistantsImport.php         (golden reference)
├── Exports/
│   ├── DriversExport.php
│   └── AssistantsExport.php
├── Models/
│   ├── User.php                     (central, has all 1:1 relations)
│   ├── Driver.php                   (extension: primaryKey = user_id)
│   ├── Assistant.php
│   ├── FieldSupervisor.php
│   └── SchoolAdmin.php
└── Traits/
    └── DataTableTrait.php           (search, sort, paginate, export)

resources/js/
├── lib/DS.ts                        (Design System tokens)
├── Components/
│   ├── BaseDataTable.tsx            (TanStack wrapper)
│   ├── InputError.tsx               (bilingual error translation)
│   ├── Modal.tsx
│   ├── PrintReportHeader.tsx        (shared print header)
│   └── ...
├── Pages/
│   ├── Admin/
│   │   ├── Drivers/Index.tsx        (golden reference)
│   │   ├── Assistants/Index.tsx     (golden reference)
│   │   ├── FieldSupervisors/Index.tsx (Phase 4 — to build)
│   │   └── SchoolManagers/Index.tsx   (Phase 5 — to build)
│   └── Print/
│       └── SharedPrintReport.tsx    (GLOBAL — never duplicate)
├── Contexts/ThemeContext.tsx         (isRTL, theme)
└── hooks/useTranslation.ts          (t() function, lang)
```

---

**END OF STANDARDS DOCUMENT**

> Use `StaffController.php` + `Admin/Drivers/Index.tsx` as the **primary golden reference** for all new modules.
> Use `AssistantController.php` + `Admin/Assistants/Index.tsx` as the **secondary reference** for modules without license-specific fields.
