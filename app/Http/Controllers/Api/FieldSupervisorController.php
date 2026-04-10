<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\InspectionItem;
use App\Models\Inspection;
use App\Models\InspectionResult;
use App\Models\Incident;
use App\Models\Violation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FieldSupervisorController extends Controller
{
    /**
     * جلب قائمة الحافلات النشطة مع تفاصيلها
     * GET /api/field/buses
     */
    public function getBuses(): JsonResponse
    {
        $buses = Bus::with(['school', 'driver', 'supervisor'])
            ->where('status', 'active')
            ->get()
            ->map(function ($bus) {
                return [
                    'id'            => $bus->id,
                    'bus_number'    => $bus->bus_number,
                    'bus_number'      => $bus->bus_number,
                    'school'        => $bus->school?->name ?? 'N/A',
                    'driver'        => $bus->driver?->name ?? 'N/A',
                    'supervisor'    => $bus->supervisor?->name ?? 'N/A',
                    'location_lat'  => (float) $bus->current_latitude,
                    'location_lng'  => (float) $bus->current_longitude,
                    'status'        => $bus->status,
                    'trip_status'   => $bus->trip_status,
                    'speed_kmh'     => 0, // سرعة تقريبية أو من سجلات الـ GPS
                    'last_update'   => $bus->last_location_update?->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $buses
        ]);
    }

    /**
     * جلب قائمة بنود الفحص
     * GET /api/field/inspection-items
     */
    public function getInspectionItems(): JsonResponse
    {
        $items = InspectionItem::where('is_active', true)->get(['id', 'name']);
        
        return response()->json([
            'success' => true,
            'data'    => $items
        ]);
    }

    /**
     * إرسال تقرير فحص
     * POST /api/field/inspections
     */
    public function submitInspection(Request $request): JsonResponse
    {
        $request->validate([
            'bus_id'         => 'required|exists:buses,id',
            'overall_status' => 'required|in:pass,fail,warning',
            'results'        => 'required|array',
            'results.*.item_id' => 'required|exists:inspection_items,id',
            'results.*.is_passed' => 'required|boolean',
        ]);

        try {
            DB::beginTransaction();

            $photos = [];
            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $photo) {
                    $photos[] = $photo->store('inspections', 'public');
                }
            }

            $inspection = Inspection::create([
                'bus_id'         => $request->bus_id,
                'supervisor_id'  => $request->user()->id,
                'overall_status' => $request->overall_status,
                'notes'          => $request->notes,
                'photos'         => $photos,
            ]);

            foreach ($request->results as $res) {
                InspectionResult::create([
                    'inspection_id' => $inspection->id,
                    'item_id'       => $res['item_id'],
                    'is_passed'     => $res['is_passed'],
                    'notes'         => $res['notes'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Inspection submitted successfully',
                'data'    => $inspection
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('[Inspection] Submit failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to submit inspection'], 500);
        }
    }

    /**
     * إرسال بلاغ طارئ
     * POST /api/field/incidents
     */
    public function reportIncident(Request $request): JsonResponse
    {
        $request->validate([
            'bus_id'      => 'required|exists:buses,id',
            'type'        => 'required|in:sos,accident,breakdown,health',
            'severity'    => 'required|in:low,medium,high,critical',
            'description' => 'required|string',
        ]);

        $photos = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $photos[] = $photo->store('incidents', 'public');
            }
        }

        $incident = Incident::create([
            'bus_id'       => $request->bus_id,
            'reporter_id'  => $request->user()->id,
            'type'         => $request->type,
            'severity'     => $request->severity,
            'description'  => $request->description,
            'location_lat' => $request->location_lat,
            'location_lng' => $request->location_lng,
            'photos'       => $photos,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Incident reported successfully',
            'data'    => $incident
        ], 201);
    }

    /**
     * تسجيل مخالفة
     * POST /api/field/violations
     */
    public function submitViolation(Request $request): JsonResponse
    {
        $request->validate([
            'bus_id'      => 'required|exists:buses,id',
            'type'        => 'required|string',
            'description' => 'required|string',
        ]);

        $photos = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $photos[] = $photo->store('violations', 'public');
            }
        }

        $violation = Violation::create([
            'bus_id'      => $request->bus_id,
            'reporter_id' => $request->user()->id,
            'type'        => $request->type,
            'description' => $request->description,
            'photos'      => $photos,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Violation reported successfully',
            'data'    => $violation
        ], 201);
    }
}


