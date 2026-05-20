<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TripAttendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'trip_id',
        'student_id',
        'check_in_time',
        'check_out_time',
        'status',
        'waiting_start_time',
        'extra_wait_time',
    ];

    protected $casts = [
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'waiting_start_time' => 'datetime',
    ];

    /**
     * Get the trip for this attendance record.
     */
    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    /**
     * Get the student for this attendance record.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
