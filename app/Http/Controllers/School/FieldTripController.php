<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\Classroom;
use App\Models\FieldTrip;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FieldTripController extends Controller
{
    public function index()
    {
        $schoolId = Auth::user()->getSchoolId();

        $fieldTrips = FieldTrip::where('school_id', $schoolId)
            ->with(['bus.driver', 'bus.assistant'])
            ->withCount(['students', 'internalTeachers'])
            ->latest('date')
            ->get();

        $buses = Bus::where('school_id', $schoolId)
            ->where('status', 'active')
            ->with(['driver', 'assistant'])
            ->get();

        // Fetch Classrooms with Students for selection
        $classrooms = Classroom::atSchool($schoolId)
            ->with(['students' => function ($q) {
                $q->select('students.id', 'first_name_ar', 'last_name_ar', 'student_code');
            }])
            ->get();

        // Fetch Teachers for selection
        $teachers = User::atSchool($schoolId)
            ->whereHas('roles', fn ($q) => $q->where('roles.name', 'teacher'))
            ->select('id', 'first_name_ar', 'last_name_ar', 'phone')
            ->get();

        return Inertia::render('School/FieldTrips/Index', [
            'fieldTrips' => $fieldTrips,
            'buses' => $buses,
            'classrooms' => $classrooms,
            'teachers' => $teachers,
        ]);
    }

    /**
     * Store a new field trip.
     */
    public function store(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('FieldTripController@store BEGIN', [
            'request_all' => $request->all(),
            'user_id' => Auth::id(),
            'school_id' => Auth::user()->getSchoolId() ?? 'NULL',
        ]);

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'required|string|max:1000',
                'date' => ['required', 'date', 'after_or_equal:today'],
                'departure_time' => [
                    'required',
                    function ($attribute, $value, $fail) use ($request) {
                        if ($request->filled('date') && $request->date === now()->toDateString()) {
                            $departureDateTime = \Carbon\Carbon::parse($request->date.' '.$value);
                            if ($departureDateTime->isPast()) {
                                $fail(__('لا يمكن أن يكون موعد انطلاق الرحلة في وقت سابق عن الوقت الحالي.'));
                            }
                        }
                    },
                ],
                'arrival_time' => 'nullable|after:departure_time',
                'destination_address' => 'required|string|max:255',
                'destination_latitude' => 'required|numeric',
                'destination_longitude' => 'required|numeric',
                'student_ids' => 'required|array|min:1',
                'student_ids.*' => 'exists:students,id',
                'teacher_ids' => 'required|array|min:1',
                'teacher_ids.*' => 'exists:users,id',
                'external_members' => 'nullable|array',
                'external_members.*.name' => 'required|string|min:3|max:255',
                'external_members.*.phone' => 'required|string|min:8|max:20',
                'external_members.*.national_id' => 'required|string|min:6|max:50',
            ], [
                'date.after_or_equal' => __('لا يمكن إنشاء رحلة ميدانية بتاريخ سابق.'),
                'arrival_time.after' => __('يجب أن يكون وقت الوصول المتوقع بعد وقت انطلاق الرحلة.'),
                'teacher_ids.required' => __('يجب تحديد معلم واحد على الأقل للإشراف على الرحلة الميدانية ومرافقة الطلاب.'),
                'teacher_ids.min' => __('يجب تحديد معلم واحد على الأقل للإشراف على الرحلة الميدانية ومرافقة الطلاب.'),
                'student_ids.required' => __('يجب تحديد طالب واحد على الأقل في الرحلة الميدانية.'),
                'student_ids.min' => __('يجب تحديد طالب واحد على الأقل في الرحلة الميدانية.'),
            ]);
            \Illuminate\Support\Facades\Log::info('FieldTrip Validation PASSED', $validated);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('FieldTrip Validation FAILED', [
                'errors' => $e->errors(),
                'data' => $request->all(),
            ]);
            throw $e;
        }

        DB::beginTransaction();
        try {
            $data = [
                'school_id' => Auth::user()->getSchoolId(),
                'name' => $validated['name'],
                'description' => $validated['description'],
                'date' => $validated['date'],
                'departure_time' => $validated['departure_time'],
                'arrival_time' => $validated['arrival_time'] ?? null,
                'destination_address' => $validated['destination_address'],
                'destination_latitude' => $validated['destination_latitude'],
                'destination_longitude' => $validated['destination_longitude'],
                'status' => 'pending',
            ];

            \Illuminate\Support\Facades\Log::info('Attempting FieldTrip::create', $data);

            $fieldTrip = FieldTrip::create($data);

            // Resolve National IDs for Students
            $studentNationalIds = Student::whereIn('id', $validated['student_ids'])
                ->pluck('national_id')
                ->filter()
                ->toArray();

            $fieldTrip->students()->syncWithPivotValues($studentNationalIds, ['type' => 'student']);

            // Resolve National IDs for Internal Teachers
            if (! empty($validated['teacher_ids'])) {
                $teacherNationalIds = User::whereIn('id', $validated['teacher_ids'])
                    ->pluck('national_id')
                    ->filter()
                    ->toArray();

                $fieldTrip->internalTeachers()->syncWithPivotValues($teacherNationalIds, ['type' => 'user']);
            }

            // Save External Members to the participants table (ignoring name/phone as they are removed from migration)
            if (! empty($validated['external_members'])) {
                foreach ($validated['external_members'] as $external) {
                    if (! empty($external['national_id'])) {
                        $fieldTrip->participants()->create([
                            'national_id' => $external['national_id'],
                            'type' => 'external',
                        ]);
                    }
                }
            }

            \Illuminate\Support\Facades\Log::info('FieldTrip created SUCCESS', ['id' => $fieldTrip->id]);

            // Note: Teacher names are stored as JSON in the field_trips table
            // In the new logic, buses/drivers are assigned by the company admin later.

            // إرسال إشعار للمشرفين الإداريين (اختياري)
            try {
                $notificationService = app(\App\Services\NotificationService::class);
                $notificationService->notifyCompanyAdmins(
                    'field_trip_request',
                    '🆕 طلب رحلة ميدانية جديد',
                    'قامت مدرسة '.Auth::user()->school->name.' بتقديم طلب لرحلة: '.$fieldTrip->name,
                    ['trip_id' => $fieldTrip->id]
                );
                \Illuminate\Support\Facades\Log::info('Notification sent to admins');
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Notification failed but trip created', ['error' => $e->getMessage()]);
            }

            DB::commit();
            \Illuminate\Support\Facades\Log::info('Transaction COMMITTED');

            return redirect()->route('school.field-trips.index')
                ->with('success', 'تم تقديم طلب الرحلة الميدانية بنجاح. في انتظار مراجعة وتحديد التكلفة من إدارة الشركة.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('FieldTrip storage EXCEPTION', [
                'msg' => $e->getMessage(),
                'trace' => substr($e->getTraceAsString(), 0, 500),
            ]);
            DB::rollBack();

            return redirect()->back()
                ->with('error', 'حدث خطأ أثناء إنشاء الرحلة: '.$e->getMessage());
        }
    }

    /**
     * Display the specified field trip (AJAX).
     */
    public function show(FieldTrip $fieldTrip)
    {
        if ($fieldTrip->school_id !== Auth::user()->getSchoolId()) {
            abort(403);
        }

        return response()->json([
            'trip' => $fieldTrip->load([
                'students.currentEnrollment.classroom',
                'internalTeachers',
                'externalParticipants',
                'bus.driver',
                'bus.assistant',
            ]),
        ]);
    }

    /**
     * Update field trip status or details.
     */
    public function update(Request $request, FieldTrip $fieldTrip)
    {
        // Ensure the trip belongs to the authenticated user's school
        if ($fieldTrip->school_id !== Auth::user()->getSchoolId()) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => 'sometimes|in:planned,approved,in_progress,completed,cancelled',
        ]);

        $fieldTrip->update($validated);

        return redirect()->back()
            ->with('success', 'تم تحديث بيانات الرحلة بنجاح');
    }

    /**
     * Delete a field trip (only if not started).
     */
    public function destroy(FieldTrip $fieldTrip)
    {
        // Ensure the trip belongs to the authenticated user's school
        if ($fieldTrip->school_id !== Auth::user()->getSchoolId()) {
            abort(403);
        }

        // Only allow deletion of planned trips
        if (in_array($fieldTrip->status, ['in_progress', 'completed'])) {
            return redirect()->back()
                ->with('error', 'لا يمكن حذف رحلة جارية أو مكتملة');
        }

        $fieldTrip->delete();

        return redirect()->back()
            ->with('success', 'تم حذف الرحلة بنجاح');
    }
}
