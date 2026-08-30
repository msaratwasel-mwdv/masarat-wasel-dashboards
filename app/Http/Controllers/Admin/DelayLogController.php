<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Delay;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DelayLogController extends Controller
{
    use \App\Traits\DataTableTrait;

    /**
     * Display a listing of delay records.
     */
    public function index(Request $request)
    {
        $query = Delay::with(['student:id,full_name,national_id', 'bus:id,bus_code,bus_number', 'reporter']);

        $paginated = $this->applyDataTable($query, $request, [
            'type',
            'reason',
            'bus.bus_number',
            'student.full_name',
            'reporter.name',
        ], 15);

        return Inertia::render('Admin/Reports/DelayLogs', [
            'delays' => $paginated,
            'filters' => $request->only(['search', 'type', 'date']),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Delay $delay)
    {
        $delay->delete();

        return redirect()->back()->with('success', 'تم حذف سجل التأخير بنجاح');
    }
}
