<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FieldTrip extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'bus_id',
        'trip_name',
        'description',
        'trip_date',
        'trip_time',
        'duration_days',
        'destination',
        'destination_lat',
        'destination_lng',
        'number_of_students',
        'teacher_names',
        'cost',
        'status',
        'rejection_reason',
        'approved_by_school',
        'approved_by_company',
    ];

    /**
     * Get the bus for this trip.
     */
    public function bus(): BelongsTo
    {
        return $this->belongsTo(Bus::class);
    }

    protected $casts = [
        'trip_date' => 'date',
        'duration_days' => 'integer',
        'number_of_students' => 'integer',
        'teacher_names' => 'array',
        'approved_by_school' => 'boolean',
        'approved_by_company' => 'boolean',
        'cost' => 'decimal:2',
        'destination_lat' => 'decimal:8',
        'destination_lng' => 'decimal:8',
    ];

    /**
     * Get the school for this trip.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get the participants for this trip.
     */
    public function participants(): HasMany
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


