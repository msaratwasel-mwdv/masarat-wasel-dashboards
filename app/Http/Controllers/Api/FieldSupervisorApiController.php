<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\Incident;
use App\Models\Inspection;
use App\Models\InspectionItem;
use App\Models\Violation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FieldSupervisorApiController extends Controller
{
    /**
     * Get all buses with their locations and status.
     */
    public function buses(Request $request): JsonResponse
    {
        $buses = Bus::with(['driver.user', 'school', 'assistant', 'fieldSupervisor'])
            ->active()
            ->get()
            ->map(function ($bus) {
                $lat = (float) $bus->current_latitude;
                $lng = (float) $bus->current_longitude;
                $isFallback = false;

                if ($lat == 0.0 || $lng == 0.0) {
                    $isFallback = true;
                    if ($bus->latitude && $bus->longitude && (float) $bus->latitude != 0.0 && (float) $bus->longitude != 0.0) {
                        $lat = (float) $bus->latitude;
                        $lng = (float) $bus->longitude;
                    } else {
                        $lat = (float) ($bus->school && $bus->school->latitude ? $bus->school->latitude : 23.5880);
                        $lng = (float) ($bus->school && $bus->school->longitude ? $bus->school->longitude : 58.3829);
                    }
                }

                // If using fallback, apply deterministic jittering to avoid stacking markers perfectly on top of each other
                if ($isFallback) {
                    $busIdInt = (int) $bus->id;
                    $offsetAngle = ($busIdInt * 137.5) * (pi() / 180.0);
                    $offsetDistance = 0.00015 + (($busIdInt % 5) * 0.00005); // approx 15-40 meters
                    $lat += $offsetDistance * cos($offsetAngle);
                    $lng += $offsetDistance * sin($offsetAngle);
                }

                return [
                    'id' => $bus->id,
                    'bus_number' => $bus->bus_number,
                    'school' => $bus->school ? $bus->school->name : null,
                    'driver' => $bus->driver ? $bus->driver->name : null,
                    'assistant' => $bus->assistant ? $bus->assistant->name : null,
                    'supervisor' => $bus->assistant ? $bus->assistant->name : null,
                    'field_supervisor' => $bus->fieldSupervisor ? $bus->fieldSupervisor->name : null,
                    'front_qr' => $bus->front_qr ? asset('storage/'.$bus->front_qr) : null,
                    'back_qr' => $bus->back_qr ? asset('storage/'.$bus->back_qr) : null,
                    'location_lat' => $lat,
                    'location_lng' => $lng,
                    'target_lat' => $bus->target_latitude,
                    'target_lng' => $bus->target_longitude,
                    'status' => $bus->status,
                    'trip_status' => $bus->trip_status,
                    'speed_kmh' => in_array($bus->trip_status, ['on_route', 'to_school', 'to_home']) ? rand(30, 60) : 0,
                    'last_update' => $bus->last_location_update ? $bus->last_location_update->toIso8601String() : null,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $buses,
        ]);
    }

    /**
     * Get dynamic inspection checklist items.
     */
    public function inspectionItems(): JsonResponse
    {
        $items = InspectionItem::where('is_active', true)
            ->orderBy('order_index')
            ->get(['id', 'name']);

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * Submit an inspection report.
     */
    public function storeInspection(Request $request): JsonResponse
    {
        $request->validate([
            'bus_id' => 'required|exists:buses,id',
            'results' => 'required|array',
            'results.*.item_id' => 'required|exists:inspection_items,id',
            'results.*.is_passed' => 'required|boolean',
            'results.*.notes' => 'nullable|string',
            'notes' => 'nullable|string',
            'overall_status' => 'required|in:pass,fail,warning',
            'photos' => 'nullable|array',
            'photos.*' => 'image|max:2048',
        ]);

        $photoPaths = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $photoPaths[] = $photo->store('inspections', 'public');
            }
        }

        $inspection = Inspection::create([
            'field_supervisor_id' => $request->user()->id,
            'bus_id' => $request->bus_id,
            'overall_status' => $request->overall_status,
            'notes' => $request->notes,
            'photos' => $photoPaths,
        ]);

        foreach ($request->results as $result) {
            $inspection->results()->create([
                'inspection_item_id' => $result['item_id'],
                'is_passed' => $result['is_passed'],
                'notes' => $result['notes'] ?? null,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Inspection submitted successfully',
            'data' => $inspection->load('results.item'),
        ], 201);
    }

    /**
     * Report an incident (SOS, Breakdown, Accident, Health).
     */
    public function storeIncident(Request $request): JsonResponse
    {
        $request->validate([
            'bus_id' => 'required|exists:buses,id',
            'type' => 'required|in:sos,accident,breakdown,health',
            'severity' => 'required|in:low,medium,high,critical',
            'description' => 'required|string',
            'location_lat' => 'nullable|numeric',
            'location_lng' => 'nullable|numeric',
            'photos' => 'nullable|array',
            'photos.*' => 'image|max:2048',
        ]);

        $photoPaths = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $photoPaths[] = $photo->store('incidents', 'public');
            }
        }

        $incident = Incident::create([
            'reporter_id' => $request->user()->id,
            'bus_id' => $request->bus_id,
            'type' => $request->type,
            'severity' => $request->severity,
            'description' => $request->description,
            'location_lat' => $request->location_lat,
            'location_lng' => $request->location_lng,
            'status' => 'active',
            'photos' => $photoPaths,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Incident reported successfully',
            'data' => $incident,
        ], 201);
    }

    /**
     * Report a violation.
     */
    public function storeViolation(Request $request): JsonResponse
    {
        $request->validate([
            'bus_id' => 'required|exists:buses,id',
            'type' => 'required|string|max:255',
            'description' => 'required|string',
            'photos' => 'nullable|array',
            'photos.*' => 'image|max:2048',
        ]);

        $photoPaths = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $photoPaths[] = $photo->store('violations', 'public');
            }
        }

        $violation = Violation::create([
            'field_supervisor_id' => $request->user()->id,
            'bus_id' => $request->bus_id,
            'type' => $request->type,
            'description' => $request->description,
            'status' => 'pending',
            'photos' => $photoPaths,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Violation reported successfully',
            'data' => $violation,
        ], 201);
    }
}
