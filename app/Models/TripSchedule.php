<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TripSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'bus_id',
        'school_id',
        'day_of_week',
        'gathering_time',
        'departure_time',
        'return_time',
        'last_dropoff_time',
        'is_exception',
        'exception_date',
        'exception_reason',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'is_exception' => 'boolean',
        'exception_date' => 'date',
    ];

    /**
     * Get the bus for this schedule.
     */
    public function bus(): BelongsTo
    {
        return $this->belongsTo(Bus::class);
    }

    /**
     * Get the school for this schedule.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get the day name.
     */
    public function getDayName(): string
    {
        $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return $days[$this->day_of_week] ?? 'Unknown';
    }
}


