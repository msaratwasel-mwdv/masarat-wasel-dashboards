<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inspection;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InspectionLogController extends Controller
{
    use \App\Traits\DataTableTrait;

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

        $paginated = $this->applyDataTable($query, $request, [
            'overall_status',
            'bus.bus_number',
            'fieldSupervisor.name'
        ], 15);

        return Inertia::render('Admin/Reports/InspectionLogs', [
            'inspections' => $paginated,
            'filters' => $request->only(['search', 'status', 'date']),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Inspection $inspection)
    {
        $inspection->delete();
        return redirect()->back()->with('success', 'تم حذف سجل الفحص بنجاح');
    }
}


