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
        $query = BusRequest::with(['school', 'bus.driver', 'bus.assistant', 'bus.fieldSupervisor']);

        // Status filter
        $status = $request->input('status');
        if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
            $query->where('status', $status);
        }

        // Apply DataTable (search, sort, paginate)
        $paginated = $this->applyDataTable($query, $request, [
            'purpose',
            'school.name',
            'request_type',
        ], 15, function($busReq) {
            return [
                'المدرسة' => $busReq->school ? $busReq->school->name : 'غير محدد',
                'نوع الطلب' => match($busReq->request_type) {
                    'permanent' => 'دائم',
                    'temporary' => 'مؤقت',
                    default => $busReq->request_type
                },
                'المقاعد المطلوبة' => $busReq->seats,
                'التكلفة الإجمالية' => $busReq->cost ? number_format($busReq->cost, 2) . ' ريال' : 'غير محدد',
                'السبب' => $busReq->purpose,
                'تاريخ الإنشاء' => $busReq->created_at->format('Y-m-d H:i'),
                'الحالة' => match($busReq->status) {
                    'pending' => 'قيد الانتظار',
                    'approved' => 'مقبول',
                    'rejected' => 'مرفوض',
                    default => $busReq->status
                },
                'الحافلة المخصصة' => $busReq->bus ? $busReq->bus->bus_number : 'لم يتم التخصيص',
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
            'bus_id' => 'required|exists:buses,id',
            'cost' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($busRequest, $validated) {
            $busRequest->update([
                'status' => 'approved',
                'cost' => $validated['cost'],
                'bus_id' => $validated['bus_id'],
                'approved_at' => now(),
            ]);

            // Assign bus to the school
            $bus = Bus::findOrFail($validated['bus_id']);
            $bus->update(['school_id' => $busRequest->school_id]);
        });

        return redirect()->back()
            ->with('success', 'تم الموافقة على الطلب وتعيين الحافلة بنجاح');
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
            'approved_at' => now(),
            'rejection_reason' => $validated['rejection_reason'] ?? null,
        ]);

        return redirect()->back()
            ->with('success', 'تم رفض الطلب');
    }
}


