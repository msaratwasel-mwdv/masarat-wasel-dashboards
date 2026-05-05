<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemEventLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_type',
        'entity_type',
        'entity_id',
        'user_id',
        'role',
        'before_data',
        'after_data',
    ];

    protected $casts = [
        'before_data' => 'array',
        'after_data' => 'array',
    ];
}
