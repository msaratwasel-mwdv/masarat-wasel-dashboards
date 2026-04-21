<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\Delay;
use App\Models\InspectionItem;
use App\Models\Inspection;
use App\Models\InspectionResult;
use App\Models\Incident;
use App\Models\Student;
use App\Models\Violation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FieldSupervisorController extends Controller
{
    public function __construct(protected \App\Services\NotificationService $notificationService) {}

    /**
     * إحصائيات لوحة التحكم للمشرف الميداني
     * GET /api/field/dashboard-stats
     */
    public function getDashboardStats(): JsonResponse
    {
        $activeBuses = Bus::where('status', 'active')->count();
        $activeDrivers = \App\Models\User::whereHas('roles', function($query) {
            $query->where('name', 'driver');
        })->whereHas('driver', function($query) {
            $query->where('status', 'active');
        })->count();
        $activeTrips = \App\Models\Trip::where('status', 'in_progress')->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'active_buses'   => $activeBuses,
                'active_drivers' => $activeDrivers,
                'active_trips'   => $activeTrips,
            ]
        ]);
    }

    /**
     * جلب قائمة السائقين والمشرفات
     * GET /api/field/staff
     */
    public function getStaff(): JsonResponse
    {
        $drivers = \App\Models\User::whereHas('roles', function($query) {
            $query->where('name', 'driver');
        })
            ->get()
            ->map(function ($user) {
                $bus = $user->assignedBus;
                return [
                    'id'        => $user->id,
                    'name'      => $user->name,
                    'phone'     => $user->phone,
                    'role'      => 'driver',
                    'is_active' => (bool) $user->is_active,
                    'bus_code'  => $bus ? $bus->bus_code : null,
                    'bus_id'    => $bus ? $bus->id : null,
                    'image'     => $user->image,
                ];
            });

        $supervisors = \App\Models\User::whereHas('roles', function($query) {
            $query->where('name', 'assistant');
        })
            ->get()
            ->map(function ($user) {
                $bus = $user->assignedBusAsAssistant;
                return [
                    'id'        => $user->id,
                    'name'      => $user->name,
                    'phone'     => $user->phone,
                    'role'      => 'assistant',
                    'is_active' => (bool) $user->is_active,
                    'bus_code'  => $bus ? $bus->bus_code : null,
                    'bus_id'    => $bus ? $bus->id : null,
                    'image'     => $user->image,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => [
                'drivers'     => $drivers,
                'supervisors' => $supervisors,
            ]
        ]);
    }

    /**
     * جلب قائمة الحافلات النشطة مع تفاصيلها
     * GET /api/field/buses
     */
    public function getBuses(): JsonResponse
    {
        $buses = Bus::with(['school', 'assistant', 'fieldSupervisor'])
            ->where('status', 'active')
            ->get()
            ->map(function ($bus) {
                return [
                    'id'              => $bus->id,
                    'bus_number'      => $bus->bus_number,
                    'bus_code'        => $bus->bus_code,
                    'school'          => $bus->school?->name ?? 'N/A',
                    'driver'          => $bus->driver?->name ?? 'N/A',
                    'assistant'       => $bus->assistant?->name ?? 'N/A',
                    'field_supervisor'=> $bus->fieldSupervisor?->name ?? 'N/A',
                    'location_lat'    => (float) $bus->current_latitude,
                    'location_lng'    => (float) $bus->current_longitude,
                    'status'          => $bus->status,
                    'trip_status'     => $bus->trip_status,
                    'speed_kmh'       => 0,
                    'last_update'     => $bus->last_location_update?->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $buses
        ]);
    }

    /**
     * جلب قائمة بنود الفحص
     * GET /api/field/inspection-items
     */
    public function getInspectionItems(): JsonResponse
    {
        $items = InspectionItem::where('is_active', true)->get(['id', 'name']);
        
        return response()->json([
            'success' => true,
            'data'    => $items
        ]);
    }

    /**
     * إرسال تقرير فحص
     * POST /api/field/inspections
     */
    public function submitInspection(Request $request): JsonResponse
    {
        $request->validate([
            'bus_id'         => 'required|exists:buses,id',
            'overall_status' => 'required|in:pass,fail,warning',
            'results'        => 'required|array',
            'results.*.item_id' => 'required|exists:inspection_items,id',
            'results.*.is_passed' => 'required|boolean',
        ]);

        try {
            DB::beginTransaction();

            $photos = [];
            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $photo) {
                    $photos[] = $photo->store('inspections', 'public');
                }
            }

            $inspection = Inspection::create([
                'bus_id'              => $request->bus_id,
                'field_supervisor_id' => $request->user()->id,
                'overall_status'      => $request->overall_status,
                'notes'               => $request->notes,
                'photos'              => $photos,
            ]);

            foreach ($request->results as $res) {
                InspectionResult::create([
                    'inspection_id'      => $inspection->id,
                    'inspection_item_id' => $res['item_id'],
                    'is_passed'          => $res['is_passed'],
                    'notes'              => $res['notes'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Inspection submitted successfully',
                'data'    => $inspection
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('[Inspection] Submit failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to submit inspection'], 500);
        }
    }

    /**
     * إرسال بلاغ طارئ
     * POST /api/field/incidents
     */
    public function reportIncident(Request $request): JsonResponse
    {
        $request->validate([
            'bus_id'      => 'required|exists:buses,id',
            'type'        => 'required|in:sos,behavioral,health,technical,traffic',
            'severity'    => 'required|in:low,medium,high,critical',
            'description' => 'required|string',
            'student_ids' => 'required_if:type,behavioral|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $photos = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $photos[] = $photo->store('incidents', 'public');
            }
        }
        if ($request->hasFile('photo')) {
            $photos[] = $request->file('photo')->store('incidents', 'public');
        }

        $incident = Incident::create([
            'bus_id'       => $request->bus_id,
            'reporter_id'  => $request->user()->id,
            'type'         => $request->type,
            'severity'     => $request->severity,
            'description'  => $request->description,
            'location_lat' => $request->location_lat,
            'location_lng' => $request->location_lng,
            'student_ids'  => $request->student_ids,
            'photos'       => $photos,
            'status'       => 'pending',
        ]);

        // ── Notification Routing ──
        $typeLabels = [
            'sos'        => 'طوارئ SOS',
            'behavioral' => 'بلاغ سلوكي',
            'health'     => 'بلاغ صحي',
            'technical'  => 'بلاغ تقني',
            'traffic'    => 'حادث مروري',
        ];
        $typeLabel = $typeLabels[$request->type] ?? 'بلاغ';
        $reporterName = $request->user()->name ?? 'مستخدم';
        
        $details = $request->description;
        if ($request->type === 'behavioral' && !empty($request->student_ids)) {
            $studentNames = \App\Models\Student::whereIn('id', $request->student_ids)->get()->pluck('full_name')->toArray();
            if (!empty($studentNames)) {
                $details = "الطلاب: (" . implode('، ', $studentNames) . "). " . $details;
            }
        }

        try {
            $bus = Bus::with(['school', 'fieldSupervisor'])->find($request->bus_id);
            $busNumber = $bus ? $bus->bus_number : 'غير محدد';
            $schoolId = $bus ? $bus->school_id : null;
            
            $roleNames = [
                'field_supervisor' => 'المشرف الميداني',
                'assistant'        => 'مشرفة الحافلة',
                'driver'           => 'السائق',
                'school_admin'     => 'إدارة المدرسة',
                'admin'            => 'الإدارة العامة'
            ];
            $reporterRoleName = $roleNames[$request->user()->role] ?? 'مستخدم';
            
            $recipientUserIds = [];

            // 1. تحديد المستلمين حسب نوع البلاغ
            if (in_array($request->type, ['traffic', 'behavioral'])) {
                // الحوادث والبلاغات السلوكية تذهب للإدارة العامة وإدارة المدرسة
                $admins = \App\Models\User::withRole('admin')->pluck('id')->toArray();
                $schoolAdmins = [];
                if ($schoolId) {
                    $schoolAdmins = \App\Models\User::withRole('school_admin')
                        ->atSchool($schoolId)->pluck('id')->toArray();
                }
                
                $recipientUserIds = array_merge($recipientUserIds, $admins, $schoolAdmins);
            } else {
                // البلاغات الأخرى تذهب للإدارة العامة فقط
                $admins = \App\Models\User::withRole('admin')->pluck('id')->toArray();
                $recipientUserIds = array_merge($recipientUserIds, $admins);
            }

            // 2. إذا كان المرسل هو طاقم الحافلة (سائق/مشرفة) -> نبلغ المشرف الميداني المرتبط بهم
            if (in_array($request->user()->role, ['driver', 'assistant'])) {
                if ($bus && $bus->field_supervisor_id) {
                    $recipientUserIds[] = $bus->field_supervisor_id;
                }
            }

            // إزالة التكرار ومعرف المرسل من القائمة
            $recipientUserIds = array_unique(array_filter($recipientUserIds));
            $recipientUserIds = array_values(array_filter($recipientUserIds, fn($id) => $id != $request->user()->id));

            if (!empty($recipientUserIds)) {
                $icon = $request->type === 'sos' ? 'sos' : 'warning';
                $color = ($request->type === 'sos' || $request->type === 'traffic') ? '#EF4444' : '#F59E0B';

                $notification = \App\Models\Notification::create([
                    'type'             => 'incident',
                    'title'            => ($request->type === 'sos' ? '🚨 ' : '⚠️ ') . "{$typeLabel} - حافلة {$busNumber}",
                    'message'          => "تم الإبلاغ بواسطة ({$reporterRoleName}) {$reporterName}. التفاصيل: {$details}",
                    'data'             => ['incident_id' => $incident->id, 'type' => $request->type],
                    'sender_id'        => $request->user()->id,
                    'from_user_name'   => $reporterName,
                    'recipient_type'   => 'multi',
                    'total_recipients' => count($recipientUserIds),
                    'status'           => 'sent',
                    'icon'             => $icon,
                    'color'            => $color,
                ]);

                foreach ($recipientUserIds as $userId) {
                    \App\Models\NotificationRecipient::create([
                        'notification_id' => $notification->id,
                        'user_id'         => $userId,
                        'status'          => 'sent',
                        'sent_at'         => now(),
                    ]);
                    
                    // إرسال عبر Push Notification
                    $this->notificationService->sendToUser($userId, 'incident', $notification->title, $notification->message, $notification->data);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to send incident notification: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Incident reported and notifications sent',
            'data'    => $incident
        ], 201);
    }

    /**
     * تسجيل مخالفة
     * POST /api/field/violations
     */
    public function submitViolation(Request $request): JsonResponse
    {
        $request->validate([
            'bus_id'      => 'required|exists:buses,id',
            'type'        => 'required|string',
            'description' => 'required|string',
        ]);

        $photos = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $photos[] = $photo->store('violations', 'public');
            }
        }

        $violation = Violation::create([
            'bus_id'      => $request->bus_id,
            'reporter_id' => $request->user()->id,
            'type'        => $request->type,
            'description' => $request->description,
            'photos'      => $photos,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Violation reported successfully',
            'data'    => $violation
        ], 201);
    }

    /**
     * جلب قائمة الحوادث
     * GET /api/field/incidents
     */
    public function getIncidents(): JsonResponse
    {
        $incidents = Incident::with(['bus'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($inc) {
                return [
                    'id'          => $inc->id,
                    'type'        => $inc->type,
                    'severity'    => $inc->severity,
                    'description' => $inc->description,
                    'status'      => $inc->status ?? 'pending',
                    'bus_code'    => $inc->bus?->bus_number ?? 'N/A',
                    'bus_id'      => $inc->bus_id,
                    'location_lat'=> $inc->location_lat,
                    'location_lng'=> $inc->location_lng,
                    'photos'      => $inc->photo_urls,
                    'student_names'=> $inc->student_names,
                    'created_at'  => $inc->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $incidents,
        ]);
    }

    /**
     * جلب سجل التفتيشات
     * GET /api/field/inspections
     */
    public function getInspections(): JsonResponse
    {
        $inspections = Inspection::with(['bus', 'results.item'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($ins) {
                $totalItems  = $ins->results->count();
                $passedItems = $ins->results->where('is_passed', true)->count();
                return [
                    'id'             => $ins->id,
                    'bus_id'         => $ins->bus_id,
                    'bus_code'       => $ins->bus?->bus_code ?? 'N/A',
                    'overall_status' => $ins->overall_status,
                    'notes'          => $ins->notes,
                    'total_items'    => $totalItems,
                    'passed_items'   => $passedItems,
                    'date'           => $ins->created_at->toDateString(),
                    'created_at'     => $ins->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $inspections,
        ]);
    }

    /**
     * جلب الرحلات الميدانية
     * GET /api/field/field-trips
     */
    public function getFieldTrips(): JsonResponse
    {
        $trips = \App\Models\FieldTrip::with(['school', 'bus'])
            ->orderByDesc('trip_date')
            ->get()
            ->map(function ($trip) {
                return [
                    'id'          => $trip->id,
                    'trip_name'   => $trip->trip_name,
                    'description' => $trip->description,
                    'destination' => $trip->destination,
                    'trip_date'   => $trip->trip_date,
                    'trip_time'   => $trip->trip_time,
                    'duration'    => $trip->duration_days,
                    'status'      => $trip->status,
                    'school'      => $trip->school?->name ?? 'N/A',
                    'bus_code'    => $trip->bus?->bus_code ?? 'N/A',
                    'students'    => $trip->number_of_students,
                    'cost'        => $trip->cost,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $trips,
        ]);
    }

    /**
     * تقرير شامل للوحة التحكم
     * GET /api/field/report
     */
    public function getDashboardReport(): JsonResponse
    {
        $activeBuses    = Bus::where('status', 'active')->count();
        $totalBuses     = Bus::count();
        $activeDrivers  = \App\Models\User::whereHas('roles', function($query) {
            $query->where('name', 'driver');
        })->whereHas('driver', function($query) {
            $query->where('status', 'active');
        })->count();
        $totalDrivers   = \App\Models\User::whereHas('roles', function($query) {
            $query->where('name', 'driver');
        })->count();
        $todayTrips     = \App\Models\Trip::whereDate('created_at', today())->count();
        $todayIncidents = Incident::whereDate('created_at', today())->count();
        $todayInspections = Inspection::whereDate('created_at', today())->count();
        $pendingIncidents = Incident::where('status', 'pending')->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'active_buses'       => $activeBuses,
                'total_buses'        => $totalBuses,
                'active_drivers'     => $activeDrivers,
                'total_drivers'      => $totalDrivers,
                'today_trips'        => $todayTrips,
                'today_incidents'    => $todayIncidents,
                'today_inspections'  => $todayInspections,
                'pending_incidents'  => $pendingIncidents,
            ],
        ]);
    }

    /**
     * جلب قائمة التأخيرات
     * GET /api/field/delays
     */
    public function getDelays(Request $request): JsonResponse
    {
        $query = Delay::with(['student', 'bus'])
            ->orderByDesc('created_at');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $delays = $query->get()->map(function ($delay) {
            return [
                'id'               => $delay->id,
                'type'             => $delay->type,
                'student_name'     => $delay->student?->full_name,
                'student_id'       => $delay->student_id,
                'national_id'      => $delay->student?->national_id,
                'bus_id'           => $delay->bus_id,
                'bus_code'         => $delay->bus?->bus_code ?? 'N/A',
                'duration_minutes' => $delay->duration_minutes,
                'reason'           => $delay->reason,
                'notes'            => $delay->notes,
                'created_at'       => $delay->created_at->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $delays,
        ]);
    }

    /**
     * تسجيل تأخير جديد
     * POST /api/field/delays
     */
    public function storeDelay(Request $request): JsonResponse
    {
        $request->validate([
            'type'             => 'required|in:student,bus',
            'student_id'       => 'nullable|required_if:type,student|exists:students,id',
            'bus_id'           => 'nullable|required_if:type,bus|exists:buses,id',
            'duration_minutes' => 'required|integer|min:1',
            'reason'           => 'nullable|string',
            'notes'            => 'nullable|string',
        ]);

        $delay = Delay::create([
            'type'             => $request->type,
            'student_id'       => $request->student_id,
            'bus_id'           => $request->bus_id,
            'duration_minutes' => $request->duration_minutes,
            'reason'           => $request->reason,
            'notes'            => $request->notes,
            'reporter_id'      => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Delay recorded successfully',
            'data'    => $delay,
        ], 201);
    }

    /**
     * جلب قائمة الطلاب للبحث
     * GET /api/field/students
     */
    public function getStudentsList(Request $request): JsonResponse
    {
        $query = Student::where('is_active', true);

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('national_id', 'like', "%{$search}%")
                  ->orWhere('student_code', 'like', "%{$search}%");
            });
        }

        $students = $query->limit(50)->get()->map(function ($student) {
            return [
                'id'          => $student->id,
                'name'        => $student->full_name,
                'national_id' => $student->national_id ?? '',
                'code'        => $student->student_code ?? '',
                'school_id'   => $student->school_id,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $students,
        ]);
    }

    /**
     * إعادة تعيين سائق أو مشرفة لحافلة
     * POST /api/field/reassign-staff
     */
    public function reassignStaff(Request $request): JsonResponse
    {
        $request->validate([
            'bus_id'  => 'required|exists:buses,id',
            'user_id' => 'required|exists:users,id',
            'type'    => 'required|in:driver,assistant',
        ]);

        $busId = $request->bus_id;
        $userId = $request->user_id;
        $type = $request->type;

        try {
            DB::beginTransaction();

            $user = \App\Models\User::findOrFail($userId);

            if ($type === 'driver') {
                if (!$user->hasRole('driver')) {
                    return response()->json(['success' => false, 'message' => 'User is not a driver'], 400);
                }

                // فك ارتباط أي سائق قديم بهذا الباص
                \App\Models\Driver::where('bus_id', $busId)->update(['bus_id' => null]);
                
                // تعيين السائق الجديد
                \App\Models\Driver::where('user_id', $userId)->update(['bus_id' => $busId]);
                
                $message = 'تم إعادة تعيين السائق بنجاح';
            } else {
                if (!$user->hasRole('assistant')) {
                    return response()->json(['success' => false, 'message' => 'User is not an assistant'], 400);
                }

                // تعيين المشرفة الجديدة للباص (يحل محل القديمة تلقائياً)
                Bus::where('id', $busId)->update(['assistant_id' => $userId]);
                
                $message = 'تم إعادة تعيين المشرفة بنجاح';
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $message,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('[Staff Reassignment] failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'فشل في إعادة التعيين'], 500);
        }
    }
}
