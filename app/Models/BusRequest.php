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
     * Get the buses assigned to this request.
     */
    public function buses(): BelongsToMany
    {
        return $this->belongsToMany(Bus::class, 'bus_request_assignments')->withTimestamps();
    }

    protected $fillable = [
        'school_id',
        'request_type',
        'requested_seats',
        'total_cost',
        'start_date',
        'end_date',
        'reason',
        'special_requirements',
        'status',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'approved_at' => 'datetime',
        'requested_seats' => 'integer',
        'total_cost' => 'decimal:2',
    ];

    /**
     * Get the school that owns the request.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get the user who approved the request.
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
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


