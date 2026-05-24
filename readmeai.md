# Masarat Wasel — AI Context Document

> **Purpose**: This file is a comprehensive reference for AI assistants. It describes the full architecture, database schema, models, relationships, routes, services, events, and conventions of the Masarat Wasel project so an AI can work on new features or fixes without re-reading the entire codebase each time.
>
> **Last Updated**: May 2026

---

## 1. Project Overview

**Masarat Wasel** (مسارات وصل) is a **School Bus Transportation Management System** built for the Omani market. It provides:

- **Multi-level Web Dashboards** (Company Admin / School Admin) built with React + Inertia.js
- **Mobile APIs** for Flutter apps (Driver, Assistant/Supervisor, Parent, Teacher, Field Supervisor)
- **Real-time Bus GPS Tracking** via WebSockets (Laravel Reverb)
- **Push Notifications** via Firebase Cloud Messaging (FCM) with bilingual AR/EN support
- **In-App Chat** between school staff (private messaging via WebSockets)
- **Subscription & Billing** system with plans, installments, and payment tracking
- **Attendance System** for both classroom and bus (trip) attendance
- **Field Operations** including inspections, violations, incidents, and delays
- **Academic Calendar & Holiday Management** for auto-trip generation

---

## 2. Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| PHP | ^8.2 | Runtime |
| Laravel | ^11.0 | Framework |
| PostgreSQL | 14+ | Database (`masarat_db`) |
| Redis (Predis) | – | Sessions, Cache |
| Laravel Sanctum | ^4.0 | API Token Authentication |
| Laravel Reverb | ^1.7 | WebSocket Server (real-time) |
| Pusher PHP Server | ^7.2 | Broadcasting compatibility layer |
| Inertia.js | ^2.0 | SPA-like server-driven UI |
| Ziggy | ^2.0 | Named Laravel routes in JS |
| kreait/laravel-firebase | 5.10 | FCM Push Notifications |
| maatwebsite/excel | ^3.1 | Excel Import/Export |
| carlos-meneses/laravel-mpdf | ^2.1 | PDF Generation |
| simplesoftwareio/simple-qrcode | ^4.2 | QR Code Generation |
| yidas/google-maps-services | ^1.2 | Geocoding & Distance |
| Sentry (optional) | ^4.25 | Error Monitoring |
| Laravel Telescope (dev) | ^5.20 | Debug Dashboard |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI Components |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Inertia.js React Adapter | Server-driven SPA |
| Google Maps JavaScript API | Maps & Tracking UI |
| Laravel Echo + Reverb | WebSocket Client |

### Infrastructure
| Service | Details |
|---|---|
| Database | PostgreSQL on port 5432, database name `masarat_db` |
| Cache/Session | Redis on port 6379 (via Predis) |
| WebSocket | Laravel Reverb on port 8080 |
| Queue | `sync` in dev (use `database` or `redis` in production) |
| Local Server | Laragon (Windows) |
| Broadcasting | Reverb (REVERB_APP_KEY=masarat-wasel-key) |

---

## 3. Development Setup

```bash
# Install dependencies
composer install
npm install

# Environment
cp .env.example .env
php artisan key:generate

# Database
php artisan migrate
php artisan db:seed

# Run everything (recommended)
composer run dev
# This starts: php artisan serve + queue:listen + pail + npm run dev
```

---

## 4. User Roles & Authentication

### Role System
Roles are stored in a **many-to-many** relationship: `users ↔ user_roles ↔ roles`.

Each role has a **1:1 extension table** that stores role-specific data (linked by `user_id` as primary key):

| Role Name | Extension Table | Dashboard Access | School Link |
|---|---|---|---|
| `admin` | _(none)_ | Full admin dashboard (`/admin/*`) | N/A (global) |
| `school_admin` | `school_admins` | School dashboard (`/school/*`) | via `school_admins.school_id` |
| `driver` | `drivers` | API only (mobile) | via `buses.school_id` (assigned bus) |
| `assistant` | `assistants` | API only (mobile) | via `buses.school_id` (assigned bus) |
| `field_supervisor` | `field_supervisors` | API only (mobile) | via `buses.school_id` (assigned bus) |
| `teacher` | `teachers` | API only (mobile) | via `teachers.school_id` |
| `parent` | `guardians` | API only (mobile) | via children's enrollment |

### Critical Architecture Note
> **`school_id` does NOT exist on the `users` table.** School association is resolved dynamically through extension tables or assigned buses. The `User::getSchoolId()` method handles this resolution chain:
> 1. `schoolAdmin.school_id`
> 2. `teacher.school_id`
> 3. `assignedBus.school_id` (for drivers)
> 4. `assignedBusAsAssistant.school_id`
> 5. `assignedBusAsFieldSupervisor.school_id`

### Authentication Methods
- **Web (Dashboard)**: Laravel Breeze + Inertia.js session auth with `auth`, `verified`, and `role:{name}` middleware
- **API (Mobile)**: Laravel Sanctum Personal Access Tokens. Login via `POST /api/auth/login` with `national_id` + `password`. Returns Bearer token.

### User Name Fields
Users have bilingual name components: `first_name_ar`, `last_name_ar`, `first_name_en`, `last_name_en`. The `name` accessor auto-selects language based on `Accept-Language` header, query param, or user preference.

### FCM Token Management
Multi-device FCM tokens are stored in the `fcm_tokens` table (not directly on user/extension tables). Each token record includes `device_type`, `device_id`, `app_bundle_id`, and `preferred_language` for per-device language targeting.

---

## 5. Database Schema

### 5.1 Core Tables

#### `plans`
Subscription plan definitions.
```
id, name, name_ar, name_en, description, description_ar, description_en,
price_per_student (decimal 10,2), price_per_student_yearly,
is_active (bool), max_buses (int, nullable=unlimited),
has_driver_app (bool), has_parent_app (bool), has_supervisor_app (bool),
notifications_limit (string, nullable), has_reports (bool),
has_api_access (bool), has_dedicated_support (bool),
sort_order (int), badge, badge_ar, badge_en, currency (default 'OMR'),
timestamps
```

#### `schools`
```
id, name, logo (nullable), latitude (decimal 10,7), longitude (decimal 10,7),
address (nullable), status (enum: Active/Inactive), plan_id (FK nullable),
timestamps
```

#### `users`
```
id, national_id (unique), first_name_ar, last_name_ar, first_name_en, last_name_en,
email (nullable, unique), phone (nullable, unique),
address (text, nullable), latitude (decimal 10,7), longitude (decimal 10,7),
image (nullable), preferred_language (nullable: ar/en),
email_verified_at, password, remember_token, timestamps
```
> Note: `second_name_ar`, `third_name_ar`, `second_name_en`, `third_name_en` columns exist in DB from original migration but are deprecated. The model only uses `first_name` + `last_name`.

#### `roles` & `user_roles`
```
roles: id, name (unique)  — values: admin, school_admin, driver, assistant, field_supervisor, teacher, parent
user_roles: user_id (FK), role_id (FK)  — composite PK
```

### 5.2 Role Extension Tables (1:1 with users, PK = user_id)

#### `school_admins`
```
user_id (PK, FK→users), school_id (FK→schools), status (enum: active/inactive), timestamps
```

#### `drivers`
```
user_id (PK, FK→users), fcm_token, license_number (unique), license_expiry_date (date),
license_front_image, license_back_image, id_card_front_image, id_card_back_image,
status (enum: active/inactive), timestamps
```

#### `assistants`
```
user_id (PK, FK→users), fcm_token, emergency_contact_name, emergency_contact_phone,
status (enum: active/inactive), timestamps
```

#### `field_supervisors`
```
user_id (PK, FK→users), fcm_token, status (enum: active/inactive), timestamps
```

#### `teachers`
```
user_id (PK, FK→users), school_id (FK→schools, nullable), grade_id (FK→grades, nullable),
fcm_token, status (enum: active/inactive), timestamps
```

#### `guardians`
```
user_id (PK, FK→users), fcm_token, school_id (FK, nullable), status (enum: active/inactive), timestamps
```

### 5.3 School Structure

#### `grades`
```
id, name, school_id (FK→schools), timestamps
```
> Grade names are in Arabic with a runtime accessor that translates to English (e.g., "الصف الأول" → "First Grade").

#### `classrooms`
```
id, name, name_en, grade_id (FK→grades), school_id (nullable, deprecated), timestamps
```
> Classroom → School relationship goes through: `Classroom → Grade → School` (via `grade.school_id`).
> `scopeAtSchool($schoolId)` filters by `grade_id IN (SELECT id FROM grades WHERE school_id = ?)`.

#### `student_school_enrollments`
```
id, student_id (FK→students), classroom_id (FK→classrooms), is_active (bool), timestamps
```
> Links students to classrooms. A student can have multiple enrollments (history), but only one `is_active = true`.

### 5.4 Students & Guardians

#### `students`
```
id, student_code (unique, nullable), national_id (nullable),
first_name_ar, last_name_ar, first_name_en, last_name_en,
gender (enum: male/female, nullable), image, is_active (bool),
address, latitude (decimal 10,8), longitude (decimal 11,8), location_note,
forth_bus_id (FK→buses, nullable), forth_latitude, forth_longitude,
back_bus_id (FK→buses, nullable), back_latitude, back_longitude,
timestamps, soft_deletes
```
> **Key**: Students have separate morning (`forth_bus_id`) and afternoon (`back_bus_id`) bus assignments with per-direction GPS coordinates. Writing to `latitude`/`longitude` auto-syncs to both directional fields.
>
> **School resolution**: `Student → currentEnrollment → classroom → grade → school`

#### `guardian_student` (pivot)
```
guardian_id (FK→users), student_id (FK→students),
relationship_type (string), timestamps
```
> Guardians are users with the `parent` role. A student can have multiple guardians and vice versa.

### 5.5 Transportation

#### `routes`
```
id, name, code, description, school_id (FK→schools),
estimated_distance_km (decimal), timestamps, soft_deletes
```

#### `buses`
```
id, bus_number (unique), plate_number (unique), capacity (int), model, year, color,
school_id (FK→schools, nullable), driver_id (FK→drivers.user_id, nullable),
assistant_id (FK→assistants.user_id, nullable),
field_supervisor_id (FK→field_supervisors.user_id, nullable),
route_id (FK→routes, nullable),
status (enum: active/maintenance/inactive/out_of_service),
front_qr, back_qr,
latitude (decimal 10,7), longitude (decimal 10,7), last_location_update (timestamp),
timestamps, soft_deletes
```
> **Bus crew**: driver, assistant (المشرفة), field_supervisor (المشرف الميداني).
> `trip_status` is a computed accessor based on `activeTrip` relationship (values: idle, to_school, to_home, at_school, in_progress).

#### `bus_groups`
```
id, bus_id (FK→buses), name, timestamps
```

#### `bus_documents`
```
id, bus_id (FK→buses), name, file_path, type, timestamps
```

#### `bus_expenses`
```
id, bus_id (FK→buses), type, description, amount, expense_date,
receipt_image, timestamps
```

#### `bus_requests`
```
id, school_id (FK→schools), bus_id (FK→buses, nullable),
type, quantity, reason, status (pending/approved/rejected),
approved_by, rejected_by, rejection_reason, timestamps
```

### 5.6 Trips & Attendance

#### `trips`
```
id, bus_id (FK→buses), school_id (FK→schools, nullable),
driver_id (FK→users, nullable — snapshot), route_id (FK→routes, nullable — snapshot),
trip_date (date, indexed), type (string: 'forth'/'back'),
video_check (bool), video_path, start_qr_scanned_at, end_qr_scanned_at,
departure_time (datetime), arrival_time (datetime),
status (string: pending/confirmed/in_progress/started/finished/cancelled),
generation_type (enum: auto/manual),
cancellation_reason, cancelled_by (FK→users),
timestamps
```
> Trips are auto-generated daily by `TripService::autoCreateDailyTrips()` for buses with routes, checking academic calendar and holidays.

#### `trip_attendances`
```
id, trip_id (FK→trips), student_id (FK→students),
check_in_time (datetime, nullable), check_out_time (datetime, nullable),
status (string: absent/waiting/boarded/dropped/excused),
waiting_start_time (datetime, nullable), extra_wait_time (nullable),
timestamps
```
> **Lifecycle**: absent → waiting → boarded → dropped. `excused` = approved absence request.

#### `attendances` (classroom attendance)
```
id, student_id (FK→students), classroom_id (FK→classrooms),
date, status (present/absent/late/excused), recorded_by, is_notified (bool),
timestamps
```

#### `absence_requests`
```
id, student_id (FK→students), date, type (full_day/morning/afternoon),
reason, status (pending/approved/rejected), processed_by, processed_at,
timestamps
```

### 5.7 Field Trips

#### `field_trips`
```
id, school_id (FK→schools), bus_id (FK→buses, nullable),
name, description, date, departure_time, arrival_time,
destination_address, destination_latitude (decimal 10,8), destination_longitude (decimal 10,8),
cost (decimal), status (pending/approved/rejected/in_progress/completed),
rejection_reason, timestamps
```

#### `field_trip_participants`
```
id, field_trip_id (FK→field_trips), national_id, name,
type (student/user/external), timestamps
```

### 5.8 Notifications

#### `notifications`
```
id, type, title, title_en, message, message_en,
data (json), sender_id (FK→users, nullable), user_id (FK→users, nullable),
from_user_name, recipient_type (individual/group), recipient_filter (json),
template_type, total_recipients, sent_count, failed_count,
status (unread/read/sent/pending), icon, color, read_at, timestamps
```

#### `notification_recipients`
```
id, notification_id (FK→notifications), user_id (FK→users),
status (sent/pending/read), read_at, timestamps
```

#### `notification_templates`
```
id, name, type, title, title_en, message, message_en, data (json), timestamps
```

#### `fcm_tokens`
```
id, user_id (FK→users), token (unique), device_type, device_name,
device_id, app_bundle_id, preferred_language, timestamps
```

### 5.9 Chat System

#### `conversations`
```
id, school_id (FK→schools, nullable), type (private/group), title, timestamps
```

#### `chat_participants`
```
id, conversation_id (FK→conversations), user_id (FK→users),
role (member/admin), last_read_at, timestamps
```

#### `messages`
```
id, conversation_id (FK→conversations), sender_id (FK→users),
body, type (text/image/file), file_path, timestamps
```

### 5.10 Field Operations

#### `violations`
```
id, field_supervisor_id (FK→users), bus_id (FK→buses),
type, description, severity, photos (json), timestamps
```

#### `inspections`
```
id, field_supervisor_id (FK→users), bus_id (FK→buses),
status, notes, timestamps
```

#### `inspection_items`
```
id, name, category, timestamps
```

#### `inspection_results`
```
id, inspection_id (FK→inspections), inspection_item_id (FK→inspection_items),
passed (bool), notes, timestamps
```

#### `incidents`
```
id, reporter_id (FK→users), bus_id (FK→buses, nullable),
trip_id (FK, nullable), type, severity, description,
location_lat (decimal 10,8), location_lng (decimal 10,8),
status (active/pending/in_progress/resolved), resolved_by (FK→users),
student_ids (json), photos (json), timestamps, soft_deletes
```

#### `delays`
```
id, bus_id (FK→buses), reported_by (FK→users),
type, duration_minutes, reason, timestamps
```

### 5.11 Financial / Subscription

#### `subscriptions`
```
id, plan_id (FK→plans), school_id (FK→schools),
status (active/trialing/pending_approval/expired/cancelled),
start_date, end_date, timestamps
```

#### `installments`
```
id, school_id (FK→schools), subscription_id (FK→subscriptions),
installment_number (int), amount (decimal 10,2), paid_amount (decimal 10,2),
due_date (date), status (pending/partially_paid/paid/overdue), timestamps
```

#### `installment_payments`
```
id, installment_id (FK→installments), payment_transaction_id (FK→payment_transactions),
timestamps
```

#### `payment_transactions`
```
id, school_id (FK→schools), amount (decimal 10,2),
payment_method, reference_number, notes, timestamps
```

### 5.12 Calendar & Events

#### `academic_calendars`
```
id, school_id (FK→schools), name, start_date, end_date,
working_days (json — array of day names), is_active (bool), timestamps
```

#### `holidays`
```
id, school_id (FK→schools, nullable — null=global), name,
start_date, end_date, type, timestamps
```

#### `events`
```
id, title, description, event_date, location,
image, is_published (bool), timestamps
```

### 5.13 System

#### `student_location_requests`
```
id, student_id (FK→students), guardian_id (FK→users), school_id,
new_latitude, new_longitude, new_address, note, request_note,
status (pending/approved/rejected), processed_by, processed_at, timestamps
```

#### `system_event_logs`
```
id, event_type, description, user_id (FK→users, nullable),
metadata (json), timestamps
```

---

## 6. Eloquent Models — Key Relationships Map

```
Plan ──< Subscription ──< Installment ──< InstallmentPayment >── PaymentTransaction
  └──< School

School ──< Grade ──< Classroom ──< StudentSchoolEnrollment >── Student
       ──< Bus ──< Trip ──< TripAttendance >── Student
       │      ──< BusDocument
       │      ──< BusExpense
       │      ──< BusGroup
       │      >── Driver (via driver_id → drivers.user_id)
       │      >── User (via assistant_id)
       │      >── User (via field_supervisor_id)
       │      >── Route
       ──< SchoolAdmin >── User
       ──< Teacher >── User
       ──< FieldTrip ──< FieldTripParticipant
       ──< BusRequest
       ──< Conversation ──< Message
       │                ──< ChatParticipant >── User
       ──< Route ──< Bus
       ──< AcademicCalendar
       ──< Holiday
       ──< Installment

User >──< Role (via user_roles)
     ──< FcmToken
     >── SchoolAdmin (HasOne)
     >── Driver (HasOne)
     >── Assistant (HasOne)
     >── FieldSupervisor (HasOne)
     >── Teacher (HasOne)
     >── Guardian (HasOne)
     >──< Student (via guardian_student pivot, as guardian)
     >── Bus (assignedBus via driver_id)
     >── Bus (assignedBusAsAssistant via assistant_id)
     >── Bus (assignedBusAsFieldSupervisor via field_supervisor_id)
     >──< Conversation (via chat_participants)

Student ──< StudentSchoolEnrollment
        >──< User (guardians via guardian_student pivot)
        >── Bus (forthBus via forth_bus_id)
        >── Bus (backBus via back_bus_id)
        ──< TripAttendance
        ──< AbsenceRequest
        ──< StudentLocationRequest
```

### Key Model Conventions
- **Soft Deletes**: `Bus`, `Student`, `Route`, `Incident`
- **Non-incrementing PK (user_id)**: `Driver`, `Guardian`, `SchoolAdmin`, `FieldSupervisor`, `Teacher`, `Assistant`
- **Bilingual Accessors**: `User.name`, `Student.full_name`, `Classroom.name`, `Grade.name` auto-select AR/EN based on request context
- **Appended Attributes**: Models use `$appends` extensively for computed properties (e.g., `User: name, name_en, role, is_active`)

---

## 7. Services

### `NotificationService` (`app/Services/NotificationService.php`)
Central notification hub. All notifications flow through this service.

| Method | Purpose |
|---|---|
| `sendToUser(userId, type, title, message, ...)` | Single user — saves to DB + FCM push + WebSocket broadcast |
| `sendTranslatedToUser(userId, type, titleKey, messageKey, ...)` | Auto-translates using Laravel `__()` helper |
| `sendToUsers(userIds[], ...)` | Bulk — DB insert + FCM multicast + WebSocket per user |
| `notifyBusDrivers(busIds[], ...)` | Resolves driver_id from buses, then sends |
| `notifyBusSupervisors(busIds[], ...)` | Resolves field_supervisor_id from buses |
| `notifyBusAssistants(busIds[], ...)` | Resolves assistant_id from buses |
| `notifyBusCrew(busId, ...)` | Sends to driver + assistant + field supervisor of one bus |
| `notifyCompanyAdmins(...)` | Sends to all users with `admin` role |
| `notifySchoolAdmins(schoolId, ...)` | Sends to all `school_admin` users at a school |
| `notifyStudentGuardian(studentId, ...)` | Sends to all guardians linked to a student |
| `notifyBusStudentsGuardians(busId, ...)` | Sends to guardians of all students on a bus |

**FCM Details:**
- Uses `kreait/laravel-firebase` Admin SDK
- Multicast support (up to 500 tokens per batch)
- Per-device language targeting (AR/EN) based on `fcm_tokens.preferred_language`
- Collapse keys for status updates (`trip_started`, `bus_nearby`, etc.)
- Auto-cleanup of invalid/expired tokens
- Queued via `SendFcmNotification` job for async delivery
- Chat messages skip DB save to avoid badge inflation

### `TripService` (`app/Services/TripService.php`)
Manages daily trip lifecycle.

| Method | Purpose |
|---|---|
| `autoCreateDailyTrips(date?)` | Creates forth+back trips for all eligible buses (checks calendar, holidays, working days) |
| `createDailyTrip(bus, type, date)` | Creates a single trip + bulk inserts TripAttendance for assigned students |
| `syncTripAttendances(trip)` | Adds/removes attendance records when bus student assignments change |
| `markAttendance(tripId, studentId, status)` | Updates attendance + sends FCM notification to guardian |
| `validateTargetDate(date)` | Checks if a date is a working day across all schools |
| `initializeFieldTrip(fieldTrip)` | Approves a field trip |

### `GoogleMapsService` (`app/Services/GoogleMapsService.php`)
Geocoding and distance calculations using Google Maps API.

### `SubscriptionService` (`app/Services/SubscriptionService.php`)
Handles plan subscriptions, installment generation, and payment processing.

---

## 8. Events & Broadcasting

### WebSocket Channels (Laravel Reverb)
| Channel | Type | Authorization |
|---|---|---|
| `bus.{id}` | Private | Admin: always. School Admin: if bus belongs to their school. Staff: if assigned to bus. Guardian: if child is on the bus. |
| `guardian.{id}` | Private | Only the user with matching ID |
| `chat.conversation.{id}` | Private | Only conversation participants |
| `admin.dashboard` | Private | Admin role only |
| `school.dashboard.{schoolId}` | Private | School admin of that school |
| `admin.emergencies` | Private | Admin role only |
| `admin.bus-requests` | Private | Admin role only |

### Broadcast Events
| Event | Channel | Payload |
|---|---|---|
| `BusLocationUpdated` | `bus.{id}` | latitude, longitude, speed, heading, timestamp |
| `DriverLocationUpdated` | `bus.{id}` | driver location data |
| `StudentStatusUpdated` | `guardian.{id}`, `bus.{id}` | student_id, status, trip info |
| `NotificationPushed` | `App.Models.User.{id}` | notification data, correlation_id |
| `MessageSent` | `chat.conversation.{id}` | message data |
| `DashboardStatsUpdated` | `admin.dashboard` / `school.dashboard.{id}` | stats |
| `TripStatusUpdated` | `bus.{id}` | trip status change |
| `BusRequestCreated` | `admin.bus-requests` | request data |
| `BusRequestStatusChanged` | school channel | status change |
| `EmergencyReported` | `admin.emergencies` | incident data |
| `StudentLocationUpdated` | `bus.{id}` | student location |
| `TeacherAttendanceMarked` | school channel | attendance data |

---

## 9. Observers

| Observer | Model | What It Does |
|---|---|---|
| `BusObserver` | `Bus` | Auto-generates QR codes on creation |
| `BusRequestObserver` | `BusRequest` | Notifies admin on creation; notifies school on status change |
| `StudentObserver` | `Student` | Auto-generates student_code; syncs trip attendances on bus change; handles soft-delete cleanup |
| `TripObserver` | `Trip` | Broadcasts trip status updates; notifies crew on confirmation |
| `TripAttendanceObserver` | `TripAttendance` | Broadcasts student status updates on boarding/dropping |
| `NotificationObserver` | `Notification` | Invalidates notification count cache |
| `NotificationRecipientObserver` | `NotificationRecipient` | Invalidates notification count cache |
| `FieldTripObserver` | `FieldTrip` | Notifies on field trip approval/rejection |
| `IncidentObserver` | `Incident` | Broadcasts emergency to admin channel |
| `UserObserver` | `User` | Handles role cleanup on user operations |
| `AnalyticsCacheObserver` | multiple | Invalidates analytics cache on data changes |

---

## 10. Middleware

| Middleware | Alias | Purpose |
|---|---|---|
| `CheckUserRole` | `role:{name}` | Checks user has the specified role via `user_roles` |
| `HandleInertiaRequests` | _(auto)_ | Shares auth user, notification counts, pending requests counts to all Inertia pages |
| `CheckTransportAccess` | _(inline)_ | Checks school has active subscription with transport features |
| `CheckPlanFeature` | `plan.feature:{feature}` | Gates specific features (e.g., `has_attendance`, `has_field_trips`, `has_reports`) behind plan |
| `CheckAttendanceSubscription` | _(inline)_ | Ensures teacher's school has attendance subscription |

### Shared Inertia Props (every page load)
```json
{
  "auth": { "user": { ...user_data, "school": {...}, "role": "..." } },
  "notifications_count": 5,
  "pending_location_requests_count": 2,
  "pending_absence_requests_count": 1,
  "received_incidents_count": 0,
  "pending_bus_requests_count": 3,
  "active_emergencies_count": 0,
  "flash": { "success": "...", "error": "...", "import_errors": [...] }
}
```

---

## 11. Routes Summary

### Web Routes (`routes/web.php`)

#### Public
| Route | Controller | Purpose |
|---|---|---|
| `GET /` | Closure (Inertia) | Welcome/Landing page |
| `GET /subscription` | `SubscriptionPageController` | Public subscription page |
| `GET /events` | `PublicEventController` | Public events page |

#### Admin Panel (`/admin/*`) — middleware: `auth, verified, role:admin`
| Area | Controller | Key Routes |
|---|---|---|
| Dashboard | `AdminDashboardController` | `GET /admin/dashboard` |
| Schools | `SchoolController` | CRUD + toggle status |
| School Admins | `SchoolUserController` | CRUD + import/export |
| Plans | `PlanController` | Resource + toggle |
| Subscriptions | `SubscriptionController` | List, approve, reject, installment management |
| Drivers | `StaffController` | CRUD + import/export + print cards |
| Assistants | `AssistantController` | Resource + import/export + print |
| Field Supervisors | `FieldSupervisorController` | Resource + import/export |
| Buses | `BusController` | Resource + assign to school + assign route + archive/restore |
| Bus Requests | `BusRequestController` | List, approve, reject |
| Bus Expenses | `BusExpenseController` | Resource + reports (PDF/Excel) |
| Routes | `RouteController` | Resource |
| Daily Trips | `DailyTripController` | Resource + auto-create + confirm |
| Field Trips | `FieldTripController` | List + approve/reject |
| Analytics | `AnalyticsController` | Hub + operational + driver + financial + student insights |
| Field Reports | `FieldReportController` | List violations |
| Inspection Items | `InspectionItemController` | Resource |
| Inspection Logs | `InspectionLogController` | List |
| Emergencies | `EmergencyController` | List + update status |
| Delay Logs | `DelayLogController` | List |
| Chat Monitor | `ChatMonitorController` | View conversations + delete messages + alert users |
| Academic Calendar | `AcademicCalendarController` | Resource |
| Holidays | `HolidayController` | Resource |
| Events | `EventController` | Resource |
| System Commands | `SystemCommandController` | Execute artisan commands from UI |
| Location Requests | `LocationRequestController` | List + approve/reject |

#### School Panel (`/school/*`) — middleware: `auth, verified, role:school_admin`
| Area | Controller | Key Routes |
|---|---|---|
| Dashboard | `School\DashboardController` | `GET /school/dashboard` |
| Classrooms | `ClassroomController` | Resource + grades CRUD + API index |
| Teachers | `TeacherController` | Resource + import/export + print |
| Supervisors | `SupervisorController` | Resource |
| Students | `StudentController` | Resource + import/export + print cards |
| Guardians | `GuardianController` | Resource + import/export + detach student |
| Attendance | `AttendanceController` | CRUD + bulk store (gated by `has_attendance`) |
| Absence Requests | `AbsenceRequestController` | List + process |
| Buses | `School\BusController` | Resource + tracking API + live tracking + student assignments |
| Bus Groups | `BusGroupController` | Resource |
| Drivers | `School\DriverController` | List + update |
| Assistants | `School\AssistantController` | List + update |
| Bus Requests | `School\BusRequestController` | CRUD |
| Notifications | `School\NotificationController` | Resource + sent/received + preview + resend incident |
| Routes | `School\RouteController` | Resource |
| Field Trips | `School\FieldTripController` | Resource (gated by `has_field_trips`) |
| Trips Dashboard | `TripDashboardController` | Index + show |
| Trip Reports | `TripReportController` | Index + data (gated by `has_reports`) |
| Reports Hub | `School\ReportController` | Multiple report types (gated by `has_reports`) |
| Plans | `School\SubscriptionController` | View plans + transactions |
| Settings | `SchoolSettingsController` | Update school settings |
| Location Requests | `LocationRequestController` | List + approve/reject |

#### Common (any authenticated user)
| Route | Purpose |
|---|---|
| `GET /profile` | Edit profile |
| `GET /notifications/all` | All notifications page |
| `POST /notifications/{id}/read` | Mark as read |
| `POST /notifications/read-all` | Mark all as read |

### API Routes (`routes/api.php`)

#### Auth (public, rate-limited 5/min)
```
POST /api/auth/login  — { national_id, password } → { token, user }
```

#### Protected (Sanctum, rate-limited 300/min dev, 60/min prod)

**Authentication & Profile**
```
POST /api/auth/logout
GET  /api/auth/user
POST /api/auth/fcm-token
POST /api/auth/change-password
POST /api/auth/profile/update
POST /api/auth/profile/avatar
POST /api/auth/profile/language
```

**Driver/Assistant Trip Operations** (transport access required)
```
GET  /api/driver/my-trips
GET  /api/driver/trips-history
POST /api/bus/{bus}/start-trip
POST /api/bus/{bus}/confirm-trip
POST /api/bus/{bus}/mark-boarded    — { student_id, trip_id }
POST /api/bus/{bus}/mark-dropped    — { student_id, trip_id }
POST /api/bus/{bus}/scan-qr         — QR code boarding
POST /api/bus/{bus}/group-board     — batch boarding
POST /api/bus/{bus}/group-alight    — batch alighting
POST /api/bus/{bus}/mark-absent     — mark student absent
POST /api/bus/{bus}/arrive
POST /api/bus/{bus}/end-trip
POST /api/bus/{bus}/notify-near-house  — (rate limited 30/min)
GET  /api/bus/{bus}/passengers
POST /api/bus/{bus}/location        — { latitude, longitude }
GET  /api/bus/{bus}/location
```

**Parent App**
```
GET  /api/parent/profile
POST /api/parent/profile/update
POST /api/parent/profile/avatar
GET  /api/parent/children
GET  /api/parent/children/{id}/attendance
POST /api/parent/location/update
POST /api/parent/student/location/update
POST /api/parent/absence-requests
GET  /api/parent/absence-requests
GET  /api/parent/location-requests
```

**Guardian Notifications**
```
GET  /api/guardian/notifications
POST /api/guardian/notifications/{id}/read
```

**Chat**
```
GET  /api/chat/contacts
GET  /api/chat/conversations
POST /api/chat/conversations
POST /api/chat/conversations/{id}/messages
GET  /api/chat/conversations/{id}/messages
POST /api/chat/conversations/{id}/read
```

**Field Supervisor**
```
GET  /api/field/dashboard-stats
GET  /api/field/staff
GET  /api/field/buses
GET  /api/field/inspection-items
POST /api/field/inspections
GET  /api/field/inspections
POST /api/field/incidents
GET  /api/field/incidents
POST /api/field/violations
GET  /api/field/field-trips
GET  /api/field/report
GET  /api/field/delays
POST /api/field/delays
GET  /api/field/students
POST /api/field/reassign-staff
```

**Teacher**
```
GET  /api/teacher/classes
GET  /api/teacher/classes/{id}/students
PUT  /api/teacher/students/{id}/attendance
POST /api/teacher/classes/{id}/confirm-attendance
GET  /api/teacher/classes/{id}/attendance-history
GET  /api/teacher/attendance-history
GET  /api/teacher/reports/stats
```

**Subscriptions & Plans**
```
GET  /api/plans
GET  /api/subscriptions/my
POST /api/subscriptions/attendance
POST /api/subscriptions/transport
GET  /api/invoices/my
GET  /api/invoices/all
POST /api/invoices/{invoice}/payment
```

---

## 12. Frontend Structure

```
resources/js/
├── app.tsx                 # Inertia app bootstrap
├── bootstrap.ts            # Echo/Reverb + Axios setup
├── ziggy.js                # Auto-generated route definitions
├── types/                  # TypeScript type definitions
│   ├── index.d.ts          # Core interfaces (User, School, Bus, Student, etc.)
│   └── global.d.ts         # Global type augmentations
├── Contexts/               # React contexts (e.g., notification, auth)
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── constants/              # App constants
├── Layouts/                # Page layout components
├── Components/
│   ├── BaseDataTable.tsx   # Reusable paginated data table
│   ├── LiveTrackingMap.tsx  # Real-time bus tracking on Google Maps
│   ├── GoogleMapContainer.tsx  # Google Maps wrapper
│   ├── NotificationDropdown.tsx  # Real-time notification bell
│   ├── NotificationModal.tsx    # Notification compose dialog
│   ├── GuardianWizard.tsx       # Multi-step guardian creation
│   ├── LocationPicker.tsx       # Map location selector
│   ├── SearchableSelect.tsx     # Async searchable dropdown
│   ├── BusModal.tsx             # Bus create/edit modal
│   ├── PlanSelectorGrid.tsx     # Subscription plan picker
│   └── ...
├── Pages/
│   ├── Welcome.tsx         # Landing page
│   ├── Subscription.tsx    # Public subscription page
│   ├── Events.tsx          # Public events page
│   ├── Auth/               # Login, Register, etc.
│   ├── Admin/
│   │   ├── Dashboard.tsx   # Admin dashboard (44KB — complex stats)
│   │   ├── Schools/        # School CRUD pages
│   │   ├── Buses/          # Bus management
│   │   ├── Drivers/        # Driver management
│   │   ├── Assistants/     # Assistant management
│   │   ├── FieldSupervisors/
│   │   ├── Analytics/      # Analytics hub
│   │   ├── Plans/          # Subscription plans
│   │   ├── Subscriptions/  # Subscription management
│   │   ├── DailyTrips/     # Trip generation
│   │   ├── BusRequests/    # Bus request management
│   │   ├── Chat/           # Chat monitoring
│   │   └── ...
│   └── School/
│       ├── Dashboard.tsx   # School dashboard
│       ├── Students/       # Student CRUD
│       ├── Guardians/      # Guardian management
│       ├── Classrooms/     # Classroom management
│       ├── Teachers/       # Teacher management
│       ├── Buses/          # Bus management
│       ├── Attendance/     # Attendance tracking
│       ├── LiveTracking/   # Real-time bus map
│       ├── Notifications/  # Notification management
│       ├── Reports/        # Multiple report pages
│       ├── Trips/          # Trip dashboard
│       └── ...
```

---

## 13. Jobs & Queues

| Job | Purpose |
|---|---|
| `SendFcmNotification` | Async FCM multicast push. Handles batching, retry, and token cleanup. |
| `PrintStudentCardsJob` | Generate PDF of student ID cards |

### Scheduled Commands (`routes/console.php`)
- Daily trip auto-generation (via `TripService`)
- Overdue installment status updates

---

## 14. File Storage

All uploaded files use Laravel's `Storage` facade with the `local` disk:
- **Student images**: `storage/app/public/students/{filename}`
- **School logos**: `storage/app/public/schools/{filename}`
- **User avatars**: `storage/app/public/users/{filename}`
- **Bus documents**: `storage/app/public/buses/documents/{filename}`
- **Bus QR codes**: `storage/app/public/buses/qr/{filename}`
- **License/ID images**: `storage/app/public/drivers/{filename}`
- **Incident photos**: `storage/app/public/incidents/{filename}`
- **Trip videos**: `storage/app/public/trips/videos/{filename}`
- **Excel exports**: `storage/app/public/exports/{filename}`

Access URL: `{APP_URL}/storage/{path}`

---

## 15. Important Conventions & Gotchas

### Database
1. **PostgreSQL**: The DB is PostgreSQL (not MySQL despite some docs saying MySQL). Connection: `pgsql`, port `5432`, database `masarat_db`.
2. **No `school_id` on users**: Always use extension tables or `User::getSchoolId()`.
3. **Soft deletes**: Bus, Student, Route, Incident use soft deletes. Always check `withTrashed()` when needed.
4. **Bilingual data**: Most text fields have `_ar` and `_en` suffixes. Use accessors for auto-selection.
5. **Student bus assignment**: Students have TWO bus assignments (`forth_bus_id` for morning, `back_bus_id` for afternoon). These can be different buses.

### Coding
1. **N+1 prevention**: Models use `relationLoaded()` checks before accessing relationships in accessors. Always eager-load relationships when listing.
2. **Cache**: Notification counts and dashboard stats are cached (2-60 min TTL). Clear with `Cache::forget("user_{id}_notifications_count")`.
3. **UUID correlation**: Notifications use `correlation_id` UUIDs to track delivery across DB + FCM + WebSocket.
4. **Naming**: Arabic comments are common throughout the codebase. Route names follow Laravel resource conventions.
5. **Import/Export**: Excel import/export uses `maatwebsite/excel` with dedicated Import/Export classes in `app/Imports/` and `app/Exports/`.

### Frontend
1. **Inertia pages**: Server sends full page props via `Inertia::render('Page/Name', [...])`. No separate API calls needed for initial data.
2. **Real-time**: WebSocket updates use Laravel Echo with Reverb. Events are listened on private channels.
3. **Google Maps**: API key is in `.env` as `VITE_GOOGLE_MAPS_API_KEY`. All map components use `@react-google-maps/api`.
4. **Ziggy**: Named routes available in JS via `route('name', params)`.

### Deployment
1. **Queue worker required**: `php artisan queue:work` must run for async FCM notifications.
2. **Reverb required**: `php artisan reverb:start` for real-time WebSocket features.
3. **Firebase**: Requires `storage/firebase/service-account.json` for FCM. Config in `config/firebase.php`.
4. **Redis**: Required for sessions and cache in production.

---

## 16. Test Accounts

Default password for all accounts: **`password`**

| Role | Email | National ID |
|---|---|---|
| Admin | admin@wasel.com | – |
| School Admin | school@wasel.com | – |
| Driver 1 | driver1@wasel.com | 1002005001 |
| Assistant 1 | supervisor1@wasel.com | 1002004001 |
| Teacher 1 | teacher1@wasel.com | 1002006001 |
| Parent 1 | guardian1@wasel.com | 1002003001 |

---

## 17. Common AI Task Patterns

### Adding a New Feature to an Existing Model
1. Create migration: `php artisan make:migration add_{column}_to_{table}_table`
2. Update model `$fillable`, `$casts`, and any relevant accessors
3. Update controller(s) that manage the model
4. Update Inertia page component to display/edit the field
5. If the field appears in lists, update the `index` method's query

### Adding a New API Endpoint
1. Add route in `routes/api.php` inside the appropriate middleware group
2. Create/update controller in `app/Http/Controllers/Api/`
3. Always return JSON responses: `response()->json([...], 200)`
4. Use `auth:sanctum` middleware for protected routes
5. Rate limit sensitive endpoints: `->middleware('throttle:X,1')`

### Adding a New Notification Type
1. Add the type string to the notification creation call
2. Use `NotificationService::sendToUser()` or the appropriate helper
3. Always provide both `title`/`message` (Arabic) and `titleEn`/`messageEn` (English)
4. Include `data` array with `target_screen` for mobile deep linking
5. For auto-translated notifications, use `sendTranslatedToUser()` with lang keys from `lang/ar/*.php` and `lang/en/*.php`

### Adding a New Dashboard Page
1. Create controller: `app/Http/Controllers/{Admin|School}/NewController.php`
2. Add route in `routes/web.php` under the appropriate role group
3. Create React page: `resources/js/Pages/{Admin|School}/NewPage.tsx`
4. Use `Inertia::render('Admin/NewPage', ['data' => ...])` in controller
5. Add navigation link in the layout sidebar

### Adding a New Model
1. Create migration + model: `php artisan make:model NewModel -m`
2. Define `$fillable`, `$casts`, relationships
3. Register observer if needed in `AppServiceProvider`
4. Create controller and routes
5. Create Inertia page components

---

## 18. Directory Quick Reference

```
app/
├── Console/             # Artisan commands
├── Events/              # 12 broadcast events
├── Exports/             # Excel export classes
├── Http/
│   ├── Controllers/
│   │   ├── Admin/       # 29 admin controllers + Api/ subdirectory
│   │   ├── Api/         # 11 API controllers + Driver/ subdirectory
│   │   ├── Auth/        # Authentication controllers
│   │   └── School/      # 21 school controllers + Attendance/ subdirectory
│   ├── Middleware/       # 5 custom middleware
│   ├── Requests/        # Form request validation (Admin/, Auth/)
│   └── Resources/       # API resources
├── Imports/             # Excel import classes
├── Jobs/                # 2 jobs (FCM, Print)
├── Models/              # 49 Eloquent models
├── Observers/           # 11 model observers
├── Policies/            # Authorization policies
├── Providers/           # AppServiceProvider, TelescopeServiceProvider
├── Services/            # 4 service classes
└── Traits/              # Shared traits

database/
├── migrations/          # 62 migration files
├── seeders/             # 19 seeder classes
└── factories/           # Model factories

resources/js/
├── Components/          # 37+ reusable React components
├── Pages/
│   ├── Admin/           # 22 admin page directories + Dashboard.tsx
│   └── School/          # 16 school page directories + Dashboard.tsx
├── Layouts/             # Page layouts
├── Contexts/            # React contexts
├── hooks/               # Custom hooks
├── lib/                 # Utilities
├── constants/           # Constants
└── types/               # TypeScript definitions

routes/
├── web.php              # 367 lines — all web routes
├── api.php              # 174 lines — all API routes
├── channels.php         # Broadcasting channel authorization
├── auth.php             # Auth routes (Breeze)
└── console.php          # Scheduled commands
```

---

_This document covers the complete Masarat Wasel system as of May 2026. Update this file when significant architectural changes are made._
