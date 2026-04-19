<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Delay;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DelayLogController extends Controller
{
    /**
     * Display a listing of delay records.
     */
    public function index(Request $request)
    {
        $query = Delay::with(['student:id,full_name,national_id', 'bus:id,bus_code,bus_number', 'reporter']);

        // Search by bus code, student name, or national ID
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('bus', function ($bq) use ($search) {
                    $bq->where('bus_code', 'like', "%{$search}%")
                       ->orWhere('bus_number', 'like', "%{$search}%");
                })->orWhereHas('student', function ($sq) use ($search) {
                    $sq->where('full_name', 'like', "%{$search}%")
                       ->orWhere('national_id', 'like', "%{$search}%");
                })->orWhereHas('reporter', function ($rq) use ($search) {
                    $rq->where('name', 'like', "%{$search}%");
                });
            });
        }

        // Filter by type (student/bus)
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by date
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $delays = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Admin/Reports/DelayLogs', [
            'delays' => $delays,
            'filters' => $request->only(['search', 'type', 'date']),
        ]);
    }
}
