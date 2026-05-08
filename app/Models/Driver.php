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
        'id_card_front_image',
        'id_card_back_image',
        'status',
    ];

    // NOTE: 'name' removed from $appends to prevent N+1 reverse-lookup.
    // The name is available on the parent User model when loaded via User::with('driver').
    // Use $driver->name explicitly when needed in standalone context.

    public function getNameAttribute(): ?string
    {
        // Only query if user is already loaded to prevent N+1
        return $this->relationLoaded('user') ? $this->user?->name : null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bus(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Bus::class, 'driver_id', 'user_id');
    }

}


