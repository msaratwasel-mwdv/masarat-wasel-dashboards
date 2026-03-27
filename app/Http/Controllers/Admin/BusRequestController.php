<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusRequest;
use App\Traits\DataTableTrait;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BusRequestController extends Controller
{
    use DataTableTrait;

    /**
     * Display all bus requests from all schools.
     */
    public function index(Request $request)
    {
        $query = BusRequest::with(['school', 'approvedBy']);

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
                'عدد الباصات المطلوبة' => $busReq->requested_buses_count,
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

        return Inertia::render('Admin/BusRequests/Index', [
            'requests' => $paginated,
            'counts'   => $counts,
            'filters'  => [
                'search' => $request->input('search', ''),
                'status' => $status ?? 'all',
            ],
        ]);
    }

    /**
     * Approve a bus request.
     */
    public function approve(BusRequest $busRequest)
    {
        $busRequest->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()
            ->with('success', 'تم الموافقة على الطلب بنجاح');
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
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'rejection_reason' => $validated['rejection_reason'] ?? null,
        ]);

        return redirect()->back()
            ->with('success', 'تم رفض الطلب');
    }
}
