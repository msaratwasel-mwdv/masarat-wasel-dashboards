<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Driver extends Model
{
    protected $primaryKey = 'user_id';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'fcm_token',
        'license_number',
        'license_expiry_date',
        'license_front_image',
        'license_back_image',
        'status',
        'bus_id',
    ];

    protected $appends = ['name'];

    public function getNameAttribute(): ?string
    {
        return $this->user?->name;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bus(): BelongsTo
    {
        return $this->belongsTo(Bus::class, 'bus_id');
    }

}


