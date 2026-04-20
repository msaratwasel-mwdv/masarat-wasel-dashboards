<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class BusRequest extends Model
{
    use HasFactory;

    /**
     * Get the bus assigned to this request.
     */
    public function bus(): BelongsTo
    {
        return $this->belongsTo(Bus::class);
    }

    protected $fillable = [
        'school_id',
        'request_type',
        'bus_id',
        'seats',
        'cost',
        'start_date',
        'end_date',
        'destination_address',
        'destination_location',
        'purpose',
        'details',
        'status',
        'rejection_reason',
        'approved_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'approved_at' => 'datetime',
        'seats' => 'integer',
        'cost' => 'decimal:2',
    ];

    /**
     * Get the school that owns the request.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Check if the request is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if the request is approved.
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if the request is rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }
}


