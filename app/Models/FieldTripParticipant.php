<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FieldTripParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'field_trip_id',
        'participant_type',
        'participant_id',
    ];

    /**
     * Get the field trip for this participant.
     */
    public function fieldTrip(): BelongsTo
    {
        return $this->belongsTo(FieldTrip::class);
    }

    /**
     * Get the participant (polymorphic).
     */
    public function participant()
    {
        // This will need to be customized based on participant_type
        switch ($this->participant_type) {
            case 'bus':
                return Bus::find($this->participant_id);
            case 'driver':
            case 'assistant':
            case 'teacher':
                return User::find($this->participant_id);
            default:
                return null;
        }
    }
}


