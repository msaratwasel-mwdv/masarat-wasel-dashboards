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
    use \App\Traits\DataTableTrait;

    /**
     * Display a listing of field reports (Violations, Incidents, Inspections).
     */
    public function index(Request $request)
    {
        $query = Violation::with(['fieldSupervisor', 'bus:id,bus_number']);

        $paginated = $this->applyDataTable($query, $request, [
            'type',
            'status',
            'bus.bus_number',
            'fieldSupervisor.name'
        ], 15);

        return Inertia::render('Admin/Reports/FieldReports', [
            'violations' => $paginated,
            'filters' => $request->only(['search', 'status', 'type', 'date']),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Violation $violation)
    {
        $violation->delete();
        return redirect()->back()->with('success', 'تم حذف تقرير المخالفة بنجاح');
    }
}


