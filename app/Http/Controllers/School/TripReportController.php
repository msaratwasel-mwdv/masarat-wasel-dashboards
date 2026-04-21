<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\TripAttendance;
use App\Models\Trip;
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
        $schoolId = Auth::user()->school_id;

        // Buses for dropdown
        $buses = Bus::where('school_id', $schoolId)
            ->where('status', 'active')
            ->select('id', 'bus_number', 'plate_number')
            ->get();

        // Supervisors for dropdown (users with role supervisor in this school)
        $supervisors = User::where('school_id', $schoolId)
            ->where('role', 'supervisor')
            ->select('id', 'name', 'phone')
            ->get();

        // Bus groups for dropdown
        $groups = BusGroup::where('school_id', $schoolId)
            ->with('bus:id,bus_number')
            ->select('id', 'name', 'bus_id')
            ->get();

        return Inertia::render('School/TripReports/Index', [
            'buses' => $buses,
            'supervisors' => $supervisors,
            'groups' => $groups,
            'school' => Auth::user()->school,
        ]);
    }

    /**
     * Get trip report data based on filters.
     */
    public function getData(Request $request)
    {
        $schoolId = Auth::user()->school_id;

        $request->validate([
            'bus_id' => 'nullable|exists:buses,id',
            'trip_type' => 'nullable|in:to_school,to_home,both',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'supervisor_id' => 'nullable|exists:users,id',
            'group_id' => 'nullable|exists:bus_groups,id',
        ]);

        $busId = $request->input('bus_id');
        $tripType = $request->input('trip_type', 'both');
        $dateFrom = $request->input('date_from', now()->toDateString());
        $dateTo = $request->input('date_to', now()->toDateString());
        $supervisorId = $request->input('supervisor_id');
        $groupId = $request->input('group_id');

        // Build the bus query
        $busQuery = Bus::where('school_id', $schoolId)->with(['supervisor', 'groups']);

        if ($busId) {
            $busQuery->where('id', $busId);
        }
        if ($supervisorId) {
            $busQuery->where('supervisor_id', $supervisorId);
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
                    $tripType = ($direction === 'to_school') ? 'forth' : 'back';

                    // Get trip attendances for this bus, type, and date range
                    $attendances = TripAttendance::whereHas('trip', function($q) use ($bus, $tripType, $dateFrom, $dateTo) {
                        $q->where('bus_id', $bus->id)
                          ->where('type', $tripType)
                          ->whereDate('trip_date', '>=', $dateFrom)
                          ->whereDate('trip_date', '<=', $dateTo);
                    })->with('trip')->get()->groupBy('student_id');

                    // Calculate trip start and end times from the Trip model
                    $trips = Trip::where('bus_id', $bus->id)
                        ->where('type', $tripType)
                        ->whereDate('trip_date', '>=', $dateFrom)
                        ->whereDate('trip_date', '<=', $dateTo)
                        ->orderBy('departure_time')
                        ->get();

                    $tripStartTime = $trips->first()?->departure_time?->format('h:i:s A');
                    $tripEndTime = $trips->last()?->arrival_time?->format('h:i:s A');

                    // Build student rows
                    $studentRows = [];
                    foreach ($students as $index => $student) {
                        $studentAttendances = $attendances->get($student->id, collect());
                        $attendance = $studentAttendances->first();

                        $busAtDoor = $attendance?->check_in_time?->format('h:i:s A');
                        $busNearby = null; 
                        $boardingTime = $attendance?->check_in_time?->format('h:i:s A');
                        $alightingTime = $attendance?->check_out_time?->format('h:i:s A');

                        // Status
                        $status = $attendance && $attendance->check_in_time ? 'arrived' : 'absent';

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
                        'supervisor_name' => $bus->supervisor?->name ?? '-',
                        'supervisor_phone' => $bus->supervisor?->phone ?? '-',
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
