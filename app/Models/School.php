<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends User
{
    protected $table = 'users';

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::addGlobalScope('school', function ($builder) {
            $builder->where('role', 'school');
        });

        static::creating(function ($school) {
            $school->role = 'school';
        });
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function classrooms(): HasMany
    {
        return $this->hasMany(Classroom::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentSchoolEnrollment::class);
    }

    public function buses(): HasMany
    {
        return $this->hasMany(Bus::class);
    }

    public function busRequests(): HasMany
    {
        return $this->hasMany(BusRequest::class);
    }

    public function tripSchedules(): HasMany
    {
        return $this->hasMany(TripSchedule::class);
    }

    public function fieldTrips(): HasMany
    {
        return $this->hasMany(FieldTrip::class);
    }
}
