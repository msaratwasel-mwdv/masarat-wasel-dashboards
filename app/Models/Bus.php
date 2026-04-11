<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Bus extends Model
{
    use HasFactory, SoftDeletes;


    protected $fillable = [
        'bus_number',
        'plate_number',
        'capacity',
        'model',
        'year',
        'type',
        'school_id',
        'field_supervisor_id',
        'assistant_id',
        'status',
        'qr_code_path',
        'color',
        'current_latitude',
        'current_longitude',
        'last_location_update',
        'trip_status',
        'route_id',
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
     * Get the primary driver assigned to the bus.
     */
    public function driver(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Driver::class, 'bus_id', 'id');
    }

    /**
     * Get the assistant (المشرفة) assigned to the bus.
     */
    public function assistant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assistant_id');
    }

    /**
     * Get the field supervisor (المشرف الميداني) assigned to the bus.
     */
    public function fieldSupervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'field_supervisor_id');
    }




    /**
     * Get the users (drivers/supervisors) associated with this bus through a pivot table.
     */
    public function user_buses(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_buses', 'bus_id', 'user_id');
    }

    /**
     * Get the groups assigned to this bus.
     */
    public function groups(): HasMany
    {
        return $this->hasMany(BusGroup::class);
    }

    /**
     * Get the trip schedules for the bus.
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(TripSchedule::class);
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class);
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    public function latestTrip(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Trip::class)->latestOfMany();
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
     * Scope to include students count efficiently.
     */
    public function scopeWithStudentsCount($query)
    {
        return $query->addSelect('buses.*')->selectSub(function ($query) {
            $query->from('students')
                ->selectRaw('count(*)')
                ->where('is_active', true)
                ->where(function ($q) {
                    $q->whereColumn('students.forth_bus_id', 'buses.id')
                        ->orWhereColumn('students.back_bus_id', 'buses.id');
                });
        }, 'students_count');
    }

    /**
     * Scope for available buses (not assigned to any school).
     */
    public function scopeAvailable($query)
    {
        return $query->whereNull('school_id');
    }

    /**
     * Get the students assigned to this bus for morning trips.
     */
    public function forthStudents(): HasMany
    {
        return $this->hasMany(Student::class, 'forth_bus_id');
    }

    /**
     * Get the students assigned to this bus for afternoon trips.
     */
    public function backStudents(): HasMany
    {
        return $this->hasMany(Student::class, 'back_bus_id');
    }

    /**
     * Get all unique students assigned to this bus (morning or afternoon).
     * This is a "fake" relationship to satisfy existing withCount calls if possible,
     * but since Eloquent doesn't support multiple keys easily, we'll keep it as a placeholder.
     */
    public function students(): HasMany
    {
        // Default to forthStudents for now to avoid breaking relationships that expect HasMany/BelongsToMany
        return $this->forthStudents();
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
        return Student::where(function ($query) {
            $query->where('forth_bus_id', $this->id)
                ->orWhere('back_bus_id', $this->id);
        })
        ->where('is_active', true)
        ->count();
    }

    /**
     * Get the requests this bus has been assigned to.
     */
    public function busRequests(): BelongsToMany
    {
        return $this->belongsToMany(BusRequest::class, 'bus_request_assignments')->withTimestamps();
    }

    /**
     * Check if the bus has a complete crew (driver and field supervisor).
     */
    public function hasCompleteCrew(): bool
    {
        return $this->driver()->exists() && $this->field_supervisor_id !== null;
    }

    /**
     * Check if the given user ID is part of the bus crew (driver or field supervisor).
     */
    public function hasCrewMember(int $userId): bool
    {
        return $this->field_supervisor_id === $userId || 
               $this->driver?->user_id === $userId;
    }
}


