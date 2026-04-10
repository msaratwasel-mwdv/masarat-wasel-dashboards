<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AssignmentHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    // app/Http/Controllers/Admin/ReportController.php

    public function assignmentHistory(Request $request)
    {
        $query = AssignmentHistory::with(['bus', 'newDriver', 'oldDriver', 'newSchool', 'oldSchool', 'admin', 'oldSupervisor', 'newSupervisor'])
            ->latest();

        // فلترة حسب الباص
        if ($request->filled('bus_id')) {
            $query->where('bus_id', $request->bus_id);
        }

        // فلترة حسب نوع الحدث
        if ($request->filled('event_type')) {
            $query->where('event_type', $request->event_type);
        }

        // فلترة حسب التاريخ من
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        // فلترة حسب التاريخ إلى
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $history = $query->paginate(20)->withQueryString();

        // نحتاج قائمة الباصات للفلتر
        $buses = \App\Models\Bus::withTrashed()->select('id', 'bus_number', 'plate_number')->get();

        // أنواع الأحداث المتوفرة
        $eventTypes = [
            'driver_change' => 'Driver Change',
            'supervisor_change' => 'Supervisor Change',
            'school_change' => 'School Change',
            'status_change' => 'Status Change',
            'bus_archived' => 'Bus Archived',
            'bus_restored' => 'Bus Restored',
        ];

        return Inertia::render('Admin/Reports/AssignmentHistory', [
            'history' => $history,
            'buses' => $buses,
            'eventTypes' => $eventTypes,
            'filters' => $request->all(['bus_id', 'date_from', 'date_to', 'event_type']),
        ]);
    }
}


