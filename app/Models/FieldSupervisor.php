<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FieldSupervisor extends Model
{
    protected $primaryKey = 'user_id';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'fcm_token',
        'status',
    ];

    protected $appends = ['name', 'name_en'];

    // NOTE: 'name' removed from $appends to prevent N+1 reverse-lookup.

    public function getNameAttribute(): ?string
    {
        return $this->relationLoaded('user') ? $this->user?->name : null;
    }

    public function getNameEnAttribute(): ?string
    {
        return $this->relationLoaded('user') ? $this->user?->name_en : null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

}


