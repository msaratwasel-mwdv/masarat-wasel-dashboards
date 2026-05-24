<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TripAttendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'trip_id',
        'student_id',
        'check_in_time',
        'check_out_time',
        'status',
        'waiting_start_time',
        'extra_wait_time',
    ];

    protected $casts = [
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'waiting_start_time' => 'datetime',
    ];

    protected static function booted()
    {
        static::saved(function ($tripAttendance) {
            if (in_array($tripAttendance->status, ['boarded', 'dropped', 'absent', 'excused'])) {
                $trip = $tripAttendance->trip;
                if ($trip && $trip->bus_id) {
                    $bus = $trip->bus;
                    if ($bus) {
                        // Set memory attributes to null to force dynamic calculation
                        $bus->setAttribute('target_latitude', null);
                        $bus->setAttribute('target_longitude', null);

                        $targetLat = $bus->target_latitude;
                        $targetLng = $bus->target_longitude;

                        $bus->update([
                            'target_latitude' => $targetLat,
                            'target_longitude' => $targetLng,
                        ]);

                        // Broadcast new location to trigger target updates in parent/supervisor maps!
                        try {
                            $heading = (double) cache()->get('bus_heading_'.$bus->id, 0);

                            // Refresh bus to get latest coordinates from DB
                            $bus->refresh();
                            $lat = ($bus->latitude && (double)$bus->latitude != 0.0) ? (double) $bus->latitude : null;
                            $lng = ($bus->longitude && (double)$bus->longitude != 0.0) ? (double) $bus->longitude : null;

                            // Only broadcast if we have valid bus coordinates, to avoid corrupting the parent app map
                            if ($lat !== null && $lng !== null) {
                                // Broadcast old & new event classes for compatibility
                                broadcast(new \App\Events\BusLocationUpdated(
                                    $bus,
                                    $lat,
                                    $lng,
                                    $heading,
                                    0,
                                    $targetLat,
                                    $targetLng
                                ));
                                
                                broadcast(new \App\Events\DriverLocationUpdated(
                                    $bus,
                                    $lat,
                                    $lng,
                                    $heading,
                                    null,
                                    $targetLat,
                                    $targetLng
                                ));
                            } else {
                                \Illuminate\Support\Facades\Log::warning("Bus {$bus->id} has no valid coordinates, skipping location broadcast on attendance change.");
                            }
                        } catch (\Exception $e) {
                            \Illuminate\Support\Facades\Log::error("Failed to broadcast location on attendance change: " . $e->getMessage());
                        }
                    }
                }
            }
        });
    }

    /**
     * Get the trip for this attendance record.
     */
    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    /**
     * Get the student for this attendance record.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
