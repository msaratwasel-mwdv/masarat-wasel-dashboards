<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TripStudent extends Model
{
    use HasFactory;

    protected $fillable = [
        'trip_id',
        'student_id',
    ];

    /**
     * Get the trip for this participant record.
     */
    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    /**
     * Get the student for this participant record.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}


