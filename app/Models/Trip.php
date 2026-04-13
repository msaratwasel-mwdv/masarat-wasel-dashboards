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
    public function students(): HasMany
    {
        return $this->hasMany(TripStudent::class);
    }

    /**
     * Get the route for the trip via the assigned bus.
     */
    public function route(): \Illuminate\Database\Eloquent\Relations\HasOneThrough
    {
        return $this->hasOneThrough(
            Route::class,
            Bus::class,
            'id', // Foreign key on buses table (bus id)
            'id', // Foreign key on routes table (route id)
            'bus_id', // Local key on trips table
            'route_id' // Local key on buses table
        );
    }
}


