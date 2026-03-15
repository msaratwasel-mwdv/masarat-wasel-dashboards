<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Violation extends Model
{
    protected $fillable = [
        'bus_id',
        'reporter_id',
        'type',
        'description',
        'photos'
    ];

    protected $casts = [
        'photos' => 'array',
    ];
}
