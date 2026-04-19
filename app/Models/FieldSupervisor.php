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

    protected $appends = ['name'];

    public function getNameAttribute(): ?string
    {
        return $this->user?->name;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

}


