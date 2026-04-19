<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FieldTripParticipant extends Model
{
    protected $fillable = [
        'field_trip_id',
        'national_id',
        'type',
    ];

    /**
     * Get the field trip.
     */
    public function fieldTrip(): BelongsTo
    {
        return $this->belongsTo(FieldTrip::class);
    }

    /**
     * Get the student associated with this participant via national_id.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'national_id', 'national_id');
    }

    /**
     * Get the user associated with this participant via national_id.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'national_id', 'national_id');
    }
}
