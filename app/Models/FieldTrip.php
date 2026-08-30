<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FieldTrip extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'bus_id',
        'name',
        'description',
        'date',
        'departure_time',
        'arrival_time',
        'destination_address',
        'destination_latitude',
        'destination_longitude',
        'cost',
        'status',
        'rejection_reason',
    ];

    /**
     * Get the bus for this trip.
     */
    public function bus(): BelongsTo
    {
        return $this->belongsTo(Bus::class);
    }

    protected $casts = [
        'date' => 'date',
        'cost' => 'decimal:2',
        'destination_latitude' => 'decimal:8',
        'destination_longitude' => 'decimal:8',
        'arrival_time' => 'datetime', // Optional: if we want to treat it as carbon
    ];

    /**
     * Get the school for this trip.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get the students participating in this trip.
     */
    public function students()
    {
        return $this->belongsToMany(Student::class, 'field_trip_participants', 'field_trip_id', 'national_id', 'id', 'national_id')
            ->wherePivot('type', 'student')
            ->withTimestamps();
    }

    /**
     * Get the internal teachers participating in this trip.
     */
    public function internalTeachers()
    {
        return $this->belongsToMany(User::class, 'field_trip_participants', 'field_trip_id', 'national_id', 'id', 'national_id')
            ->wherePivot('type', 'user')
            ->withTimestamps();
    }

    /**
     * Get the external participants in this trip.
     */
    public function externalParticipants()
    {
        return $this->hasMany(FieldTripParticipant::class)->where('type', 'external');
    }

    /**
     * Get all participants.
     */
    public function participants()
    {
        return $this->hasMany(FieldTripParticipant::class);
    }

    /**
     * Check if the trip is fully approved.
     */
    public function isFullyApproved(): bool
    {
        return $this->approved_by_school && $this->approved_by_company;
    }

    /**
     * Check if the trip is in progress.
     */
    public function isInProgress(): bool
    {
        return $this->status === 'in_progress';
    }

    /**
     * Check if the trip is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }
}
