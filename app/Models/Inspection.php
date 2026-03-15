<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inspection extends Model
{
    protected $fillable = [
        'bus_id',
        'supervisor_id',
        'overall_status',
        'notes',
        'photos'
    ];

    protected $casts = [
        'photos' => 'array',
    ];

    public function bus()
    {
        return $this->belongsTo(Bus::class);
    }

    public function results()
    {
        return $this->hasMany(InspectionResult::class);
    }
}
