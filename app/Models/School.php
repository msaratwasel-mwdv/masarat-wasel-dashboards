<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class School extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'logo',
        'latitude',
        'longitude',
        'address',
        'status',
        'has_transport',
        'has_attendance',
        'transport_status',
        'plan_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array
     */
    protected $hidden = [
        // 'address', unhidden to support frontend editing
    ];

    /**
     * School admin users — via school_admins extension table.
     * NOTE: users do NOT have school_id directly on the users table.
     */
    public function schoolAdmins(): HasMany
    {
        return $this->hasMany(SchoolAdmin::class);
    }

    /**
     * @deprecated school_id does not exist on users table.
     * Use schoolAdmins() or hasManyThrough(User, SchoolAdmin) instead.
     */
    /**
     * Get all users directly associated with this school.
     * Since school_id is not on the users table, we look through our extensions.
     */
    public function users(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        // This is a custom relationship to simulate a direct link for convenience
        return $this->belongsToMany(User::class, 'school_admins', 'school_id', 'user_id');
    }

    public function classrooms(): HasMany
    {
        return $this->hasMany(Classroom::class);
    }

    public function enrollments(): HasManyThrough
    {
        return $this->hasManyThrough(
            StudentSchoolEnrollment::class,
            Classroom::class,
            'school_id',    // FK on classrooms
            'classroom_id', // FK on student_school_enrollments
            'id',           // PK on schools
            'id'            // PK on classrooms
        );
    }

    public function buses(): HasMany
    {
        return $this->hasMany(Bus::class);
    }

    public function busRequests(): HasMany
    {
        return $this->hasMany(BusRequest::class);
    }

    public function fieldTrips(): HasMany
    {
        return $this->hasMany(FieldTrip::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function currentSubscription()
    {
        return $this->hasOne(Subscription::class)->whereIn('status', ['active', 'trialing'])->latest();
    }

    public function hasFeature(string $feature): bool
    {
        if (!$this->plan_id) return false;
        
        $plan = $this->plan;
        if (!$plan) return false;
        
        return (bool) $plan->{$feature};
    }

    public function maxBuses(): ?int
    {
        if (!$this->plan_id || !$this->plan) return 0;
        return $this->plan->max_buses;
    }

    public function totalOwed(): float
    {
        // Calculate pending installments amount directly
        return $this->installments()
            ->whereIn('status', ['pending', 'overdue'])
            ->sum('amount');
    }

    public function installments()
    {
        return $this->hasMany(Installment::class);
    }
}


