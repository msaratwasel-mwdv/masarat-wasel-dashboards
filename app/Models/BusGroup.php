<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'bus_id',
        'name',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function bus(): BelongsTo
    {
        return $this->belongsTo(Bus::class);
    }

    public function morningStudents(): HasMany
    {
        return $this->hasMany(Student::class, 'morning_group_id');
    }

    public function afternoonStudents(): HasMany
    {
        return $this->hasMany(Student::class, 'afternoon_group_id');
    }
}
