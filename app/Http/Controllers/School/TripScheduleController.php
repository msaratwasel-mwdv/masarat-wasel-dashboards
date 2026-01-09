<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\TripSchedule;
use App\Models\Bus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TripScheduleController extends Controller
{
    public function index()
    {
        $schoolId = Auth::user()->school_id;

        $schedules = TripSchedule::where('school_id', $schoolId)
            ->with('bus')
            ->orderBy('day_of_week')
            ->orderBy('gathering_time')
            ->get()
            ->map(function ($schedule) {
                // Add bus_number to each schedule for frontend
                $schedule->bus_number = $schedule->bus ? $schedule->bus->bus_number : 'N/A';
                return $schedule;
            });

        $buses = Bus::where('school_id', $schoolId)
            ->where('status', 'active')
            ->get();

        return Inertia::render('School/TripSchedules/Index', [
            'schedules' => $schedules,
            'buses' => $buses,
        ]);
    }

    /**
     * Store a new trip schedule.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'bus_id' => 'required|exists:buses,id',
            'day_of_week' => 'required|integer|between:0,6',
            'gathering_time' => 'required|date_format:H:i',
            'departure_time' => 'required|date_format:H:i',
            'return_time' => 'required|date_format:H:i',
            'last_dropoff_time' => 'required|date_format:H:i',
            'is_exception' => 'boolean',
            'exception_date' => 'nullable|required_if:is_exception,true|date',
            'exception_reason' => 'nullable|string|max:255',
        ]);

        $validated['school_id'] = Auth::user()->school_id;

        TripSchedule::create($validated);

        return redirect()->back()
            ->with('success', 'تم حفظ الجدول بنجاح');
    }

    /**
     * Update an existing trip schedule.
     */
    public function update(Request $request, TripSchedule $tripSchedule)
    {
        // Ensure the schedule belongs to the authenticated user's school
        if ($tripSchedule->school_id !== Auth::user()->school_id) {
            abort(403);
        }

        $validated = $request->validate([
            'gathering_time' => 'required|date_format:H:i',
            'departure_time' => 'required|date_format:H:i',
            'return_time' => 'required|date_format:H:i',
            'last_dropoff_time' => 'required|date_format:H:i',
            'is_exception' => 'boolean',
            'exception_date' => 'nullable|required_if:is_exception,true|date',
            'exception_reason' => 'nullable|string|max:255',
        ]);

        $tripSchedule->update($validated);

        return redirect()->back()
            ->with('success', 'تم تحديث الجدول بنجاح');
    }

    /**
     * Copy schedule from one week to another.
     */
    public function copy(Request $request)
    {
        $validated = $request->validate([
            'source_week' => 'required|date',
            'target_week' => 'required|date|different:source_week',
            'bus_ids' => 'nullable|array',
            'bus_ids.*' => 'exists:buses,id',
        ]);

        $schoolId = Auth::user()->school_id;

        // Get schedules from source week
        $query = TripSchedule::where('school_id', $schoolId);
        
        if (!empty($validated['bus_ids'])) {
            $query->whereIn('bus_id', $validated['bus_ids']);
        }

        $sourceSchedules = $query->get();

        // Copy to target week
        foreach ($sourceSchedules as $schedule) {
            TripSchedule::create([
                'bus_id' => $schedule->bus_id,
                'school_id' => $schoolId,
                'day_of_week' => $schedule->day_of_week,
                'gathering_time' => $schedule->gathering_time,
                'departure_time' => $schedule->departure_time,
                'return_time' => $schedule->return_time,
                'last_dropoff_time' => $schedule->last_dropoff_time,
                'is_exception' => false,
            ]);
        }

        return redirect()->back()
            ->with('success', 'تم نسخ الجدول بنجاح');
    }

    /**
     * Delete a trip schedule.
     */
    public function destroy(TripSchedule $tripSchedule)
    {
        // Ensure the schedule belongs to the authenticated user's school
        if ($tripSchedule->school_id !== Auth::user()->school_id) {
            abort(403);
        }

        $tripSchedule->delete();

        return redirect()->back()
            ->with('success', 'تم حذف الجدول بنجاح');
    }
}
