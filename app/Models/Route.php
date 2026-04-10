<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Route extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'school_id',
    ];

    /**
     * Get the school that owns the route.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get the buses assigned to this route.
     */
    public function buses(): HasMany
    {
        return $this->hasMany(Bus::class);
    }

    /**
     * Get the students assigned to this route as their morning route.
     */
    public function morningStudents(): HasMany
    {
        return $this->hasMany(Student::class, 'forth_route_id');
    }

    /**
     * Get the students assigned to this route as their afternoon route.
     */
    public function afternoonStudents(): HasMany
    {
        return $this->hasMany(Student::class, 'back_route_id');
    }
}


