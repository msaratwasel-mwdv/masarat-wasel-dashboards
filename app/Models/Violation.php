<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Violation extends Model
{
    protected $fillable = [
        'field_supervisor_id',
        'bus_id',
        'type',
        'description',
        'status',
        'photos',
    ];

    protected $casts = [
        'photos' => 'array',
    ];

    public function fieldSupervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'field_supervisor_id');
    }

    public function bus(): BelongsTo
    {
        return $this->belongsTo(Bus::class);
    }
}


