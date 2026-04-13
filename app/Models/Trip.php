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
        'route_id',
        'driver_id',
        'assistant_id',
        'trip_date',
        'type',
        'video_check',
        'departure_time',
        'arrival_time',
        'status',
    ];

    protected $casts = [
        'trip_date' => 'date',
        'video_check' => 'boolean',
        'departure_time' => 'datetime',
        'arrival_time' => 'datetime',
    ];

    /**
     * Get the school that owns the trip (via the bus).
     */
    public function school(): \Illuminate\Database\Eloquent\Relations\HasOneThrough
    {
        return $this->hasOneThrough(
            School::class,
            Bus::class,
            'id', // Foreign key on items table (bus id)
            'id', // Foreign key on schools table (school id)
            'bus_id', // Local key on trips table
            'school_id' // Local key on buses table
        );
    }

    /**
     * Get the route assigned to the trip.
     */
    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class);
    }

    /**
     * Get the bus assigned to the trip.
     */
    public function bus(): BelongsTo
    {
        return $this->belongsTo(Bus::class);
    }

    /**
     * Get the driver assigned to the trip.
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    /**
     * Get the assistant/supervisor assigned to the trip.
     */
    public function assistant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assistant_id');
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
    public function students(): HasMany
    {
        return $this->hasMany(TripStudent::class);
    }
}


