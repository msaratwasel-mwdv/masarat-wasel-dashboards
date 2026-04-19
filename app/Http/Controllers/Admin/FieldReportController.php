<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Violation;
use App\Models\Incident;
use App\Models\Inspection;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FieldReportController extends Controller
{
    /**
     * Display a listing of field reports (Violations, Incidents, Inspections).
     */
    public function index(Request $request)
    {
        $query = Violation::with(['fieldSupervisor', 'bus:id,bus_number']);

        // Search by bus code/number or supervisor name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('bus', function ($bq) use ($search) {
                    $bq->where('bus_number', 'like', "%{$search}%");
                })->orWhereHas('fieldSupervisor', function ($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%");
                });
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by date
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $violations = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Admin/Reports/FieldReports', [
            'violations' => $violations,
            'filters' => $request->only(['search', 'status', 'type', 'date']),
        ]);
    }
}


