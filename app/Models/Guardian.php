<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Guardian extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_en',
        'national_id',
        'phone',
        'email',
        'address',
        'home_latitude',
        'home_longitude',
        'proximity_alert_distance',
        'home_number',
        'preferred_language',
        'image',
        'school_id',
        'user_id',
    ];

    protected $casts = [
        'home_latitude' => 'decimal:7',
        'home_longitude' => 'decimal:7',
        'proximity_alert_distance' => 'integer',
    ];

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }
    
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}