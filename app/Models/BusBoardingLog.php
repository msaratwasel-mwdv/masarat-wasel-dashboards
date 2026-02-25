<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusBoardingLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'bus_id',
        'type',        // boarding | alighting
        'direction',   // to_school | to_home
        'latitude',
        'longitude',
        'recorded_by',
        'recorded_at',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'recorded_at' => 'datetime',
    ];

    // ========== العلاقات ==========

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function bus(): BelongsTo
    {
        return $this->belongsTo(Bus::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    // ========== Scopes ==========

    public function scopeBoarding($query)
    {
        return $query->where('type', 'boarding');
    }

    public function scopeAlighting($query)
    {
        return $query->where('type', 'alighting');
    }

    public function scopeToSchool($query)
    {
        return $query->where('direction', 'to_school');
    }

    public function scopeToHome($query)
    {
        return $query->where('direction', 'to_home');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('recorded_at', today());
    }
}
