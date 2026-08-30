<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Trip extends Model
{
    use HasFactory;

    protected $fillable = [
        'bus_id',
        'trip_date',
        'type',
        'video_check',
        'video_path',
        'end_qr_scanned_at',
        'departure_time',
        'arrival_time',
        'status',
        'school_id',
        'driver_id',
        'route_id',
        'generation_type',
        'cancellation_reason',
        'cancelled_by',
    ];

    protected $casts = [
        'trip_date' => 'date:Y-m-d',
        'video_check' => 'boolean',
        'departure_time' => 'datetime:Y-m-d H:i',
        'arrival_time' => 'datetime:Y-m-d H:i',
        'end_qr_scanned_at' => 'datetime:Y-m-d H:i',
    ];

    /**
     * Get the school that owns the trip.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get the bus assigned to the trip.
     */
    public function bus(): BelongsTo
    {
        return $this->belongsTo(Bus::class);
    }

    /**
     * Get the attendance records for this trip.
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(TripAttendance::class);
    }

    /**
     * Get the participants (students) signed up for this trip (for field trips).
     */
    public function students(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'trip_attendances', 'trip_id', 'student_id')->withTimestamps();
    }

    /**
     * Get the route for the trip.
     */
    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class);
    }

    /**
     * Get the driver for the trip.
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    /**
     * Get the assistant for the trip via the assigned bus.
     */
    public function assistant()
    {
        return $this->hasOneThrough(
            User::class,
            Bus::class,
            'id',           // Foreign key on buses table (id)
            'id',           // Foreign key on users table (id)
            'bus_id',       // Local key on trips table
            'assistant_id'  // Local key on buses table
        );
    }
}
