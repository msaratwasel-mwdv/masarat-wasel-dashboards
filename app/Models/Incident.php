<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    protected $fillable = [
        'bus_id',
        'reporter_id',
        'type',
        'severity',
        'description',
        'location_lat',
        'location_lng',
        'photos'
    ];

    protected $casts = [
        'photos' => 'array',
        'location_lat' => 'decimal:7',
        'location_lng' => 'decimal:7',
    ];
}
