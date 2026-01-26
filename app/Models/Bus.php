<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bus extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'bus_code',
        'bus_number',
        'plate_number',
        'capacity',
        'model',
        'year',
        'type',
        'school_id',
        'driver_id',
        'supervisor_id',
        'status',
        'qr_code_path',
        'color',
        'current_latitude',
        'current_longitude',
        'last_location_update',
        'trip_status',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'year' => 'integer',
        'current_latitude' => 'decimal:7',
        'current_longitude' => 'decimal:7',
        'last_location_update' => 'datetime',
    ];

    /**
     * Get the school that owns the bus.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get the driver assigned to the bus.
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    /**
     * Get the supervisor assigned to the bus.
     */
    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    /**
     * Get the trip schedules for the bus.
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(TripSchedule::class);
    }
    public function documents()
    {
        return $this->hasMany(BusDocument::class);
    }
    // --- Helper Methods ---

    /**
     * توليد كود الباص تلقائياً
     * Example: BUS-001
     */
    public static function generateNextCode(): string
    {
        $lastBus = self::withTrashed()->latest('id')->first();
        $nextId = $lastBus ? ($lastBus->id + 1) : 1;
        return 'BUS-' . str_pad($nextId, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Check if the bus is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if the bus is under maintenance.
     */
    public function isMaintenance(): bool
    {
        return $this->status === 'maintenance';
    }

    /**
     * Check if the bus is available for use.
     */
    public function isAvailable(): bool
    {
        return $this->isActive() && !$this->isMaintenance();
    }

    /**
     * Scope for active buses.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for available buses (not assigned to any school).
     */
    public function scopeAvailable($query)
    {
        return $query->whereNull('school_id');
    }

    /**
     * Get the students assigned to this bus.
     */
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'bus_students')
                    ->withPivot('is_active')
                    ->withTimestamps();
    }

    /**
     * Get the display name for the bus.
     */
    public function getDisplayNameAttribute(): string
    {
        return "{$this->bus_number} - {$this->plate_number}";
    }

    /**
     * Get the count of active students.
     */
    public function getStudentsCountAttribute(): int
    {
        return $this->students()->wherePivot('is_active', true)->count();
    }
}
