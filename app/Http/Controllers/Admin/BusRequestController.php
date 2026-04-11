<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusRequest;
use App\Models\Bus;
use App\Models\User;
use App\Traits\DataTableTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BusRequestController extends Controller
{
    use DataTableTrait;

    /**
     * Display all bus requests from all schools.
     */
    public function index(Request $request)
    {
        $query = BusRequest::with(['school', 'approvedBy', 'buses.driver', 'buses.assistant', 'buses.fieldSupervisor']);

        // Status filter
        $status = $request->input('status');
        if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
            $query->where('status', $status);
        }

        // Apply DataTable (search, sort, paginate)
        $paginated = $this->applyDataTable($query, $request, [
            'reason',
            'school.name',
            'request_type',
        ], 15, function($busReq) {
            return [
                'المدرسة' => $busReq->school ? $busReq->school->name : 'غير محدد',
                'نوع الطلب' => match($busReq->request_type) {
                    'new_route' => 'مسار جديد',
                    'change_route' => 'تغيير مسار',
                    'maintenance' => 'صيانة',
                    default => $busReq->request_type
                },
                'المقاعد المطلوبة' => $busReq->requested_seats,
                'التكلفة الإجمالية' => $busReq->total_cost ? number_format($busReq->total_cost, 2) . ' ريال' : 'غير محدد',
                'السبب' => $busReq->reason,
                'تاريخ الإنشاء' => $busReq->created_at->format('Y-m-d H:i'),
                'الحالة' => match($busReq->status) {
                    'pending' => 'قيد الانتظار',
                    'approved' => 'مقبول',
                    'rejected' => 'مرفوض',
                    default => $busReq->status
                },
                'تم الرد بواسطة' => $busReq->approvedBy ? $busReq->approvedBy->name : 'لم يتم الرد',
            ];
        });

        if ($paginated instanceof \Symfony\Component\HttpFoundation\Response) {
            return $paginated;
        }

        // Counts for filter tabs (unfiltered)
        $counts = [
            'all'      => BusRequest::count(),
            'pending'  => BusRequest::where('status', 'pending')->count(),
            'approved' => BusRequest::where('status', 'approved')->count(),
            'rejected' => BusRequest::where('status', 'rejected')->count(),
        ];

        // Get available buses (not assigned to a school)
        $availableBuses = Bus::whereNull('school_id')
            ->where('status', 'active')
            ->with(['driver', 'assistant', 'fieldSupervisor'])
            ->get();

        return Inertia::render('Admin/BusRequests/Index', [
            'requests' => $paginated,
            'counts'   => $counts,
            'filters'  => [
                'search' => $request->input('search', ''),
                'status' => $status ?? 'all',
            ],
            'availableBuses' => $availableBuses,
        ]);
    }

    /**
     * Approve a bus request.
     */
    public function approve(Request $request, BusRequest $busRequest)
    {
        $validated = $request->validate([
            'bus_ids' => 'required|array|min:1',
            'bus_ids.*' => 'exists:buses,id',
            'total_cost' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($busRequest, $validated) {
            $busRequest->update([
                'status' => 'approved',
                'total_cost' => $validated['total_cost'],
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            // Assign buses to the school
            $buses = Bus::whereIn('id', $validated['bus_ids'])->get();
            $schoolId = $busRequest->school_id;

            foreach ($buses as $bus) {
                $bus->update(['school_id' => $schoolId]);
            }

            // Sync with pivot table
            $busRequest->buses()->sync($validated['bus_ids']);
        });

        return redirect()->back()
            ->with('success', 'تم الموافقة على الطلب وتعيين الحافلات بنجاح');
    }

    /**
     * Reject a bus request.
     */
    public function reject(Request $request, BusRequest $busRequest)
    {
        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $busRequest->update([
            'status' => 'rejected',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'rejection_reason' => $validated['rejection_reason'] ?? null,
        ]);

        return redirect()->back()
            ->with('success', 'تم رفض الطلب');
    }
}


