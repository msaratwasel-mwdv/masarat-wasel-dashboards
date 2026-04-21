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

    public function fieldTrips(): HasMany
    {
        return $this->hasMany(FieldTrip::class);
    }
}


