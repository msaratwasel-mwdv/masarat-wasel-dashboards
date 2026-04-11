<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\BusBoardingLog;
use App\Models\BusGroup;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TripReportController extends Controller
{
    /**
     * Show the Trip Reports page with initial dropdown data.
     */
    public function index()
    {
        $schoolId = Auth::user()->getSchoolId();

        // Buses for dropdown
        $buses = Bus::where('school_id', $schoolId)
            ->where('status', 'active')
            ->select('id', 'bus_number', 'plate_number')
            ->get();

        // Assistants for dropdown
        $assistants = User::whereHas('assignedBusAsAssistant', fn($q) => $q->where('school_id', $schoolId))
            ->select('id', 'first_name_ar', 'last_name_ar', 'phone')
            ->get();

        // Field Supervisors for dropdown
        $field_supervisors = User::whereHas('assignedBusAsFieldSupervisor', fn($q) => $q->where('school_id', $schoolId))
            ->select('id', 'first_name_ar', 'last_name_ar', 'phone')
            ->get();

        // Bus groups fallback - check if still using legacy groups
        $groups = BusGroup::where('school_id', $schoolId)
            ->with('bus:id,bus_number')
            ->select('id', 'name', 'bus_id')
            ->get();

        return Inertia::render('School/TripReports/Index', [
            'buses' => $buses,
            'assistants' => $assistants,
            'field_supervisors' => $field_supervisors,
            'groups' => $groups,
            'school' => Auth::user()->school,
        ]);
    }

    /**
     * Get trip report data based on filters.
     */
    public function getData(Request $request)
    {
        $schoolId = Auth::user()->getSchoolId();

        $request->validate([
            'bus_id' => 'nullable|exists:buses,id',
            'trip_type' => 'nullable|in:to_school,to_home,both',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'assistant_id' => 'nullable|exists:users,id',
            'field_supervisor_id' => 'nullable|exists:users,id',
            'group_id' => 'nullable|exists:bus_groups,id',
        ]);

        $busId = $request->input('bus_id');
        $tripType = $request->input('trip_type', 'both');
        $dateFrom = $request->input('date_from', now()->toDateString());
        $dateTo = $request->input('date_to', now()->toDateString());
        $assistantId = $request->input('assistant_id');
        $fieldSupervisorId = $request->input('field_supervisor_id');
        $groupId = $request->input('group_id');

        // Build the bus query
        $busQuery = Bus::where('school_id', $schoolId)->with(['assistant', 'fieldSupervisor', 'groups']);

        if ($busId) {
            $busQuery->where('id', $busId);
        }
        if ($assistantId) {
            $busQuery->where('assistant_id', $assistantId);
        }
        if ($fieldSupervisorId) {
            $busQuery->where('field_supervisor_id', $fieldSupervisorId);
        }

        $buses = $busQuery->get();

        $reports = [];

        foreach ($buses as $bus) {
            // Determine which groups to use
            $busGroups = $bus->groups;
            if ($groupId) {
                $busGroups = $busGroups->where('id', $groupId);
            }

            foreach ($busGroups as $group) {
                // Get students in this group
                $students = Student::where(function ($q) use ($group) {
                    $q->where('morning_group_id', $group->id)
                      ->orWhere('afternoon_group_id', $group->id);
                })->where('is_active', true)->get();

                // Determine directions to query
                $directions = [];
                if ($tripType === 'to_school' || $tripType === 'both') {
                    $directions[] = 'to_school';
                }
                if ($tripType === 'to_home' || $tripType === 'both') {
                    $directions[] = 'to_home';
                }

                foreach ($directions as $direction) {
                    // Get boarding logs for this bus, direction, and date range
                    $logs = BusBoardingLog::where('bus_id', $bus->id)
                        ->where('direction', $direction)
                        ->whereDate('recorded_at', '>=', $dateFrom)
                        ->whereDate('recorded_at', '<=', $dateTo)
                        ->get()
                        ->groupBy('student_id');

                    // Calculate trip start and end times
                    $allLogs = BusBoardingLog::where('bus_id', $bus->id)
                        ->where('direction', $direction)
                        ->whereDate('recorded_at', '>=', $dateFrom)
                        ->whereDate('recorded_at', '<=', $dateTo)
                        ->orderBy('recorded_at')
                        ->get();

                    $tripStartTime = $allLogs->first()?->recorded_at?->format('h:i:s A');
                    $tripEndTime = $allLogs->last()?->recorded_at?->format('h:i:s A');

                    // Build student rows
                    $studentRows = [];
                    foreach ($students as $index => $student) {
                        $studentLogs = $logs->get($student->id, collect());

                        $boardingLog = $studentLogs->where('type', 'boarding')->first();
                        $alightingLog = $studentLogs->where('type', 'alighting')->first();

                        $busAtDoor = $boardingLog?->recorded_at?->format('h:i:s A');
                        $busNearby = null; 
                        $boardingTime = $boardingLog?->recorded_at?->format('h:i:s A');
                        $alightingTime = $alightingLog?->recorded_at?->format('h:i:s A');

                        // Status
                        $status = $boardingLog ? 'arrived' : 'absent';

                        $studentRows[] = [
                            'number' => $index + 1,
                            'name' => $student->full_name,
                            'bus_at_door' => $busAtDoor,
                            'bus_nearby' => $busNearby,
                            'boarding_time' => $boardingTime,
                            'alighting_time' => $alightingTime,
                            'status' => $status,
                        ];
                    }

                    $reports[] = [
                        'date' => $dateFrom,
                        'bus_number' => $bus->bus_number,
                        'plate_number' => $bus->plate_number,
                        'supervisor_name' => $bus->assistant?->full_name ?? '-',
                        'field_supervisor_name' => $bus->fieldSupervisor?->full_name ?? '-',
                        'group_name' => $group->name,
                        'direction' => $direction,
                        'direction_label' => $direction === 'to_school' ? 'رحلة ذهاب' : 'رحلة عودة',
                        'trip_start_time' => $tripStartTime ?? '-',
                        'trip_end_time' => $tripEndTime ?? '-',
                        'students' => $studentRows,
                    ];
                }
            }
        }

        return response()->json([
            'reports' => $reports,
            'school' => Auth::user()->school,
        ]);
    }
}



