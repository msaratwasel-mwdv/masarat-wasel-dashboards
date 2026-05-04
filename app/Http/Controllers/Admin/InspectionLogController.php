<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inspection;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InspectionLogController extends Controller
{
    /**
     * Display a listing of inspection logs.
     */
    public function index(Request $request)
    {
        $query = Inspection::query()->with([
            'fieldSupervisor:id,first_name_ar,last_name_ar,first_name_en,last_name_en,phone,email',
            'bus:id,bus_number',
            'results.item:id,name'
        ]);

        // Filter by overall status
        if ($request->filled('status')) {
            $query->where('overall_status', $request->status);
        }

        // Search by bus code or number
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('bus', function ($bq) use ($search) {
                    $bq->where('bus_number', 'like', "%{$search}%")
                       ->orWhere('bus_number', 'like', "%{$search}%");
                })->orWhereHas('fieldSupervisor', function ($sq) use ($search) {
                    $sq->where('first_name_ar', 'like', "%{$search}%")
                       ->orWhere('last_name_ar', 'like', "%{$search}%")
                       ->orWhere('first_name_en', 'like', "%{$search}%")
                       ->orWhere('last_name_en', 'like', "%{$search}%");
                });
            });
        }
        
        // Filter by date
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $inspections = $query->latest()->paginate(20)->withQueryString();

        return Inertia::render('Admin/Reports/InspectionLogs', [
            'inspections' => $inspections,
            'filters' => $request->only(['search', 'status', 'date']),
        ]);
    }
}


