<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'request_type',
        'number_of_buses',
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
        'number_of_buses' => 'integer',
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
