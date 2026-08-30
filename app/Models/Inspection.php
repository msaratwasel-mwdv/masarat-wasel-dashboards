<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inspection extends Model
{
    use HasFactory;

    protected $fillable = [
        'field_supervisor_id',
        'bus_id',
        'overall_status',
        'notes',
        'photos',
    ];

    protected $casts = [
        'photos' => 'array',
    ];

    public function user()
    {
        // For backwards compatibility or general mapping
        return $this->fieldSupervisor();
    }

    public function fieldSupervisor()
    {
        return $this->belongsTo(User::class, 'field_supervisor_id');
    }

    public function bus()
    {
        return $this->belongsTo(Bus::class);
    }

    public function results()
    {
        return $this->hasMany(InspectionResult::class);
    }
}
